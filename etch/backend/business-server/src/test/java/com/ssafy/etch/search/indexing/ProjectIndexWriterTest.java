package com.ssafy.etch.search.indexing;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.ElasticsearchException;
import co.elastic.clients.elasticsearch.core.GetResponse;
import co.elastic.clients.elasticsearch.core.IndexRequest;
import co.elastic.clients.elasticsearch.indices.ElasticsearchIndicesClient;
import co.elastic.clients.transport.endpoints.BooleanResponse;
import co.elastic.clients.util.ObjectBuilder;
import tools.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.function.Function;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Protocol tests supplement the real ES outage/replay checks in local/verify-project-indexing.py. */
class ProjectIndexWriterTest {
    ElasticsearchClient client = mock(ElasticsearchClient.class);
    ElasticsearchIndicesClient indices = mock(ElasticsearchIndicesClient.class);
    ProjectIndexWriter writer = new ProjectIndexWriter(client, new ObjectMapper());
    ProjectIndexStore.Snapshot snapshot = new ProjectIndexStore.Snapshot(10, 5,
        Map.of("projectId", 10L, "searchRevision", 5L, "visible", false));

    @BeforeEach void existingIndex() throws Exception {
        when(client.indices()).thenReturn(indices);
        when(indices.exists(any(Function.class))).thenReturn(new BooleanResponse(true));
    }

    @Test void writesFixedIdExternalVersionAndMinimalTombstone() throws Exception {
        doAnswer(invocation -> {
            Function<IndexRequest.Builder<Map<String,Object>>, ObjectBuilder<IndexRequest<Map<String,Object>>>> build = invocation.getArgument(0);
            var request = build.apply(new IndexRequest.Builder<>()).build();
            assertThat(request.index()).isEqualTo("project-v2");
            assertThat(request.id()).isEqualTo("10");
            assertThat(request.version()).isEqualTo(5);
            assertThat(request.versionType().jsonValue()).isEqualTo("external_gte");
            assertThat(request.document()).containsOnlyKeys("projectId", "searchRevision", "visible");
            return null;
        }).when(client).index(any(Function.class));
        writer.write(snapshot);
    }

    @Test void onlyVerifiedNewerExternalVersionSupersedesOldSnapshot() throws Exception {
        ElasticsearchException conflict = failure(409, "version_conflict_engine_exception");
        when(client.index(any(Function.class))).thenThrow(conflict);
        when(client.get(any(Function.class), eq(Map.class))).thenReturn(GetResponse.of(g -> g
            .index("project-v2").id("10").found(true).version(6L)
            .source(Map.of("projectId", 10L, "searchRevision", 6L, "visible", false))));
        assertThatCode(() -> writer.write(snapshot)).doesNotThrowAnyException();
    }

    @Test void arbitraryConflictOrUnverifiedInternalVersionIsNotAcknowledged() throws Exception {
        ElasticsearchException conflict = failure(409, "version_conflict_engine_exception");
        when(client.index(any(Function.class))).thenThrow(conflict);
        when(client.get(any(Function.class), eq(Map.class))).thenReturn(GetResponse.of(g -> g
            .index("project-v2").id("10").found(true).version(100L)
            .source(Map.of("projectId", 10L, "visible", true))));
        assertThatThrownBy(() -> writer.write(snapshot)).isSameAs(conflict);
        ElasticsearchException other = failure(409, "different_conflict");
        when(client.index(any(Function.class))).thenThrow(other);
        assertThatThrownBy(() -> writer.write(snapshot)).isSameAs(other);
    }

    private ElasticsearchException failure(int status, String type) {
        return new ElasticsearchException("index", co.elastic.clients.elasticsearch._types.ErrorResponse.of(r ->
            r.status(status).error(e -> e.type(type).reason("synthetic"))));
    }
}
