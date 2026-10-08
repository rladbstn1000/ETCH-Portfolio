package com.ssafy.etch.search.indexing;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Uses the caller's JPA/MySQL transaction. There is deliberately no ES I/O here. */
@Service
@RequiredArgsConstructor
public class ProjectIndexOutbox {
    private final EntityManager entityManager;
    private final JdbcTemplate jdbc;

    @Transactional(propagation = Propagation.MANDATORY)
    public void enqueue(long projectId) {
        // Flush managed project/tech/like changes before incrementing a DB-owned revision.
        // search_revision is intentionally not mapped: Hibernate must never write a stale value.
        entityManager.flush();
        int updated = jdbc.update("UPDATE project_post SET search_revision=search_revision+1 WHERE id=?", projectId);
        if (updated != 1) throw new IllegalStateException("PROJECT_INDEX_SOURCE_MISSING");
        jdbc.update("""
            INSERT INTO project_index_outbox(project_id, revision)
            SELECT id, search_revision FROM project_post WHERE id=?
            """, projectId);
    }
}
