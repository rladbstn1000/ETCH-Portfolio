package com.ssafy.etch.search.indexing;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class ProjectIndexWorkerTest {
    private final ProjectIndexStore store = mock(ProjectIndexStore.class);
    private final ProjectIndexWriter writer = mock(ProjectIndexWriter.class);
    private final ProjectIndexWorker worker = new ProjectIndexWorker(store, writer, 25, 60);
    private final ProjectIndexStore.Work first = new ProjectIndexStore.Work(1, 10, 1, 0);

    @Test void successfulEsWriteWithoutAcknowledgmentRetriesLatestSnapshot() throws Exception {
        var original = new ProjectIndexStore.Snapshot(10, 2, Map.of("title", "earlier"));
        var latest = new ProjectIndexStore.Snapshot(10, 3, Map.of("visible", false));
        when(store.due(25)).thenReturn(List.of(first));
        when(store.snapshot(first)).thenReturn(original, latest);
        doThrow(new IllegalStateException("sensitive database response")).doNothing().when(store).succeeded(first);

        worker.poll();
        worker.poll();

        var order = inOrder(store, writer);
        order.verify(store).due(25);
        order.verify(store).attempted(first);
        order.verify(store).snapshot(first);
        order.verify(writer).write(original);
        order.verify(store).succeeded(first);
        order.verify(store).failed(first, "IllegalStateException", 1);
        order.verify(store).due(25);
        order.verify(store).attempted(first);
        order.verify(store).snapshot(first);
        order.verify(writer).write(latest);
        order.verify(store).succeeded(first);
    }

    @Test void poisonWorkCannotBlockOtherProjectsAndFailuresRemainRetryable() throws Exception {
        var other = new ProjectIndexStore.Work(2, 11, 1, 80);
        var snapshot = new ProjectIndexStore.Snapshot(11, 1, Map.of());
        when(store.due(25)).thenReturn(List.of(first, other));
        when(store.snapshot(first)).thenThrow(new IllegalStateException("synthetic poison"));
        when(store.snapshot(other)).thenReturn(snapshot);
        worker.poll();
        verify(store).failed(first, "IllegalStateException", 1);
        verify(writer).write(snapshot);
        verify(store).succeeded(other);
        verify(store, never()).succeeded(first);
    }

    @Test void overlappingPollIsRejectedWhileFirstWriterIsInFlight() throws Exception {
        CountDownLatch entered = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        when(store.due(25)).thenReturn(List.of(first));
        var snapshot = new ProjectIndexStore.Snapshot(10, 1, Map.of());
        when(store.snapshot(first)).thenReturn(snapshot);
        doAnswer(invocation -> {
            entered.countDown();
            if (!release.await(5, TimeUnit.SECONDS)) throw new IllegalStateException("test timeout");
            return null;
        }).when(writer).write(snapshot);
        Thread thread = new Thread(worker::poll);
        thread.start();
        try {
            assertThat(entered.await(5, TimeUnit.SECONDS)).isTrue();
            worker.poll();
            verify(store, times(1)).due(25);
            verify(writer, times(1)).write(snapshot);
        } finally {
            release.countDown();
            thread.join(5000);
        }
        assertThat(thread.isAlive()).isFalse();
        verify(store).succeeded(first);
    }

    @Test void networkFailureHasBoundedIndefiniteBackoffAndNoSensitiveErrorMessage() throws Exception {
        var longOutage = new ProjectIndexStore.Work(3, 12, 5, 500);
        var snapshot = new ProjectIndexStore.Snapshot(12, 5, Map.of());
        when(store.due(25)).thenReturn(List.of(longOutage));
        when(store.snapshot(longOutage)).thenReturn(snapshot);
        doThrow(new IOException("http://internal:9200 secret body")).when(writer).write(snapshot);
        worker.poll();
        verify(store).failed(longOutage, "ES_IO_FAILURE", 60);
        verify(store, never()).succeeded(longOutage);
        assertThat(ProjectIndexWorker.backoffSeconds(1, 60)).isEqualTo(1);
        assertThat(ProjectIndexWorker.backoffSeconds(4, 60)).isEqualTo(8);
        assertThat(ProjectIndexWorker.backoffSeconds(Integer.MAX_VALUE, 60)).isEqualTo(60);
        assertThat(ProjectIndexWorker.safeError(new IllegalStateException("PROJECT_INDEX_REVISION_INVALID")))
            .isEqualTo("PROJECT_INDEX_REVISION_INVALID");
        assertThat(ProjectIndexWorker.safeError(new IllegalStateException("PROJECT_INDEX_SOURCE_MISSING")))
            .isEqualTo("PROJECT_INDEX_SOURCE_MISSING");
        assertThat(ProjectIndexWorker.safeError(new IllegalStateException("http://internal secret body")))
            .isEqualTo("IllegalStateException");
        assertThat(ProjectIndexWorker.safeError(new IllegalStateException()))
            .isEqualTo("IllegalStateException");
    }
}
