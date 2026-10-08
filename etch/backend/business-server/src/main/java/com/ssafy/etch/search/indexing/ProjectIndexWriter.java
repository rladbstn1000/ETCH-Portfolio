package com.ssafy.etch.search.indexing;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.ElasticsearchException;
import co.elastic.clients.elasticsearch._types.VersionType;
import java.io.IOException;
import java.io.StringReader;
import tools.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ProjectIndexWriter {
    public static final String INDEX = "project-v2";
    private final ElasticsearchClient client;
    private final ObjectMapper mapper;

    public void write(ProjectIndexStore.Snapshot snapshot) throws IOException {
        ensureIndex();
        try {
            client.index(i -> i.index(INDEX).id(Long.toString(snapshot.projectId()))
                .version(snapshot.revision()).versionType(VersionType.ExternalGte).document(snapshot.source()));
        } catch (ElasticsearchException failure) {
            if (failure.status() != 409 || !"version_conflict_engine_exception".equals(failure.error().type())) {
                throw failure;
            }
            // Never treat an arbitrary 409 (or an old internal ES version) as success.
            // Only a newer document in our dedicated external-version index supersedes this snapshot.
            var current = client.get(g -> g.index(INDEX).id(Long.toString(snapshot.projectId())), Map.class);
            Map<?, ?> source = current.source();
            if (!current.found() || current.version() <= snapshot.revision() || source == null
                || !(source.get("searchRevision") instanceof Number revision)
                || revision.longValue() != current.version()
                || !(source.get("projectId") instanceof Number projectId)
                || projectId.longValue() != snapshot.projectId()) {
                throw failure;
            }
        }
    }
    private void ensureIndex() throws IOException {
        // Done during retryable work, never during application startup. ES may be offline on restart.
        if (client.indices().exists(e -> e.index(INDEX)).value()) return;
        var body = mapper.createObjectNode();
        try (var settings = new ClassPathResource("es/project-settings.json").getInputStream();
             var mappings = new ClassPathResource("es/project-mappings.json").getInputStream()) {
            body.set("settings", mapper.readTree(settings));
            body.set("mappings", mapper.readTree(mappings));
        }
        try {
            client.indices().create(c -> c.index(INDEX).withJson(new StringReader(body.toString())));
        } catch (ElasticsearchException failure) {
            if (!"resource_already_exists_exception".equals(failure.error().type())) throw failure;
        }
    }
}
