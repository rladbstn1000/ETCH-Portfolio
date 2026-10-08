require "json"

def register(params)
  @kind = params.fetch("kind")
  raise ArgumentError, "unsupported synchronization kind" unless ["job", "news"].include?(@kind)
end

def filter(event)
  source_id = event.get("source_id").to_i
  revision = event.get("revision").to_i
  deleted_value = event.get("deleted")
  deleted = deleted_value == true || deleted_value.to_s == "1"
  payload = event.get("payload")
  # Transport fields and event timestamps must not influence document comparison.
  event.to_hash.keys.each { |key| event.remove(key) }
  event.set("[@metadata][source_id]", source_id)
  event.set("[@metadata][revision]", revision)
  event.set("[@metadata][kind]", @kind)
  id_field = @kind == "job" ? "jobId" : "newsId"
  begin
    unless deleted
      document = payload.is_a?(Hash) ? payload : JSON.parse(payload.to_s)
      raise ArgumentError, "expected object payload" unless document.is_a?(Hash)
      if @kind == "job"
        ["regions", "industries", "jobCategories"].each do |field|
          document[field] = (document[field] || "").split(",").map(&:strip).reject(&:empty?)
        end
      end
      document.each { |key, value| event.set(key, value) }
    end
    event.set("syncRevision", revision)
  rescue JSON::ParserError, ArgumentError, NoMethodError, TypeError
    # Malformed state remains inspectable in ES's mapping-error DLQ. Do not log payload.
    event.to_hash.keys.each { |key| event.remove(key) }
    event.set("syncRevision", "invalid-payload")
  end
  event.set(id_field, source_id)
  event.set("deleted", deleted)
  [event]
end

test "job normalization preserves business dates and removes transport fields" do
  parameters { { "kind" => "job" } }
  in_event do
    { "source_id" => 12, "revision" => 4, "deleted" => 0,
      "payload" => '{"jobId":12,"title":"fixture","regions":" 서울, 경기, ","openingDate":"2030-01-02T03:04:05"}' }
  end
  expect("normalized source") do |events|
    source = events[0].to_hash
    source["regions"] == ["서울", "경기"] && source["syncRevision"] == 4 &&
      source["openingDate"] == "2030-01-02T03:04:05" && !source.key?("@timestamp") && !source.key?("payload")
  end
end

test "deleted state only retains identifier and version" do
  parameters { { "kind" => "news" } }
  in_event { { "source_id" => 12, "revision" => 5, "deleted" => 1, "payload" => '{"title":"hidden"}' } }
  expect("minimal tombstone") do |events|
    events[0].to_hash == { "newsId" => 12, "syncRevision" => 5, "deleted" => true }
  end
end

test "malformed payload becomes a mapping error without logging source data" do
  parameters { { "kind" => "job" } }
  in_event { { "source_id" => 12, "revision" => 6, "deleted" => 0, "payload" => "[" } }
  expect("DLQ eligible") { |events| events[0].get("syncRevision") == "invalid-payload" }
end
