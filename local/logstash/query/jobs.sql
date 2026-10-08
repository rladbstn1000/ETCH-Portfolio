SELECT /* etch_sync_job */ source_id, revision, deleted, payload, changed_at
FROM search_sync_state
WHERE kind = 'job'
  AND changed_at >= TIMESTAMPADD(SECOND, 0 - :overlap_seconds, :sql_last_value)
  AND changed_at <= UTC_TIMESTAMP(6)
ORDER BY changed_at, source_id
