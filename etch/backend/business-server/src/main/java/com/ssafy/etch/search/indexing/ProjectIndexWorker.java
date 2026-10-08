package com.ssafy.etch.search.indexing;

import co.elastic.clients.elasticsearch._types.ElasticsearchException;
import java.util.concurrent.atomic.AtomicBoolean;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** One backend instance only. No durable claim/lease: unfinished rows remain retryable after restart. */
@Slf4j
@Component
@EnableScheduling
@ConditionalOnProperty(name = "app.project-indexing.enabled", havingValue = "true", matchIfMissing = true)
public class ProjectIndexWorker {
    private final ProjectIndexStore store;
    private final ProjectIndexWriter writer;
    private final int batchSize;
    private final long maxBackoffSeconds;
    private final AtomicBoolean running = new AtomicBoolean();

    public ProjectIndexWorker(ProjectIndexStore store, ProjectIndexWriter writer,
        @Value("${app.project-indexing.batch-size:25}") int batchSize,
        @Value("${app.project-indexing.max-backoff-seconds:60}") long maxBackoffSeconds) {
        this.store = store;
        this.writer = writer;
        this.batchSize = Math.max(1, Math.min(100, batchSize));
        this.maxBackoffSeconds = Math.max(1, maxBackoffSeconds);
    }

    @Scheduled(fixedDelayString = "${app.project-indexing.poll-ms:1000}",
        initialDelayString = "${app.project-indexing.initial-delay-ms:3000}")
    public void poll() {
        // fixedDelay already serializes scheduler runs; guard also rejects accidental concurrent calls.
        if (!running.compareAndSet(false, true)) return;
        try {
            for (var work : store.due(batchSize)) process(work);
        } catch (Exception failure) {
            log.warn("project_index_poll status=RETRY error={}", safeError(failure));
        } finally {
            running.set(false);
        }
    }

    private void process(ProjectIndexStore.Work work) {
        long start = System.nanoTime();
        String status = "RETRY";
        try {
            store.attempted(work); // autocommit before network I/O; no PROCESSING state to get stranded
            var snapshot = store.snapshot(work);
            writer.write(snapshot);
            store.succeeded(work); // crash here means repeat the same/latest revision safely
            status = "SUCCEEDED";
        } catch (Exception failure) {
            try {
                store.failed(work, safeError(failure), backoffSeconds(work.attempts() + 1, maxBackoffSeconds));
            } catch (Exception databaseFailure) {
                // The previous PENDING/RETRY row remains durable and due; do not hide the batch behind it.
                log.warn("project_index_ack workId={} projectId={} status=RETRY error={}",
                    work.id(), work.projectId(), safeError(databaseFailure));
            }
        } finally {
            log.info("project_index workId={} projectId={} attempt={} status={} elapsedMs={}",
                work.id(), work.projectId(), work.attempts() + 1, status, (System.nanoTime() - start) / 1_000_000);
        }
    }

    static long backoffSeconds(int attempts, long maximum) {
        return Math.min(maximum, 1L << Math.min(30, Math.max(0, attempts - 1)));
    }

    static String safeError(Exception failure) {
        // Only these fixed application codes are allowed; arbitrary exception messages stay private.
        if (failure instanceof IllegalStateException
            && ("PROJECT_INDEX_REVISION_INVALID".equals(failure.getMessage())
                || "PROJECT_INDEX_SOURCE_MISSING".equals(failure.getMessage()))) {
            return failure.getMessage();
        }
        // Exception messages can contain requests, document content, credentials or infrastructure URLs.
        if (failure instanceof ElasticsearchException elastic) return "ES_HTTP_" + elastic.status();
        if (failure instanceof java.io.IOException) return "ES_IO_FAILURE";
        return failure.getClass().getSimpleName();
    }
}
