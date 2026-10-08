package com.ssafy.etch.search.indexing;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProjectIndexStore {
    private final JdbcTemplate jdbc;

    public record Work(long id, long projectId, long revision, int attempts) {}
    public record Snapshot(long projectId, long revision, Map<String, Object> source) {}

    public List<Work> due(int limit) {
        return jdbc.query("""
            SELECT id, project_id, revision, attempts FROM project_index_outbox
            WHERE status IN ('PENDING','RETRY') AND next_attempt_at <= CURRENT_TIMESTAMP(6)
            ORDER BY next_attempt_at, id LIMIT ?
            """, (rs, row) -> new Work(rs.getLong(1), rs.getLong(2), rs.getLong(3), rs.getInt(4)), limit);
    }

    // One MySQL consistent snapshot covers project, member nickname, counters, techs and revision.
    // Returning a detached map ends this transaction BEFORE the ES network call.
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Snapshot snapshot(Work work) {
        List<Snapshot> rows = jdbc.query("""
            SELECT p.*, m.nickname,
                (SELECT COUNT(*) FROM liked_content l WHERE l.type='PROJECT' AND l.targetId=p.id) AS like_count
            FROM project_post p JOIN member m ON m.id=p.member_id WHERE p.id=?
            """, (rs, row) -> {
                long revision = rs.getLong("search_revision");
                boolean visible = rs.getBoolean("is_public") && !rs.getBoolean("is_deleted");
                Map<String, Object> source = new LinkedHashMap<>();
                source.put("projectId", work.projectId());
                source.put("searchRevision", revision);
                source.put("visible", visible);
                if (visible) {
                    source.put("title", rs.getString("title"));
                    source.put("memberName", rs.getString("nickname"));
                    source.put("projectCategory", rs.getString("category"));
                    source.put("thumbnailUrl", rs.getString("thumbnail_url"));
                    source.put("likeCount", rs.getInt("like_count"));
                    source.put("viewCount", rs.getLong("view_count"));
                    var created = rs.getTimestamp("created_at");
                    var updated = rs.getTimestamp("updated_at");
                    source.put("createdAt", created.toLocalDateTime().toLocalDate().toString());
                    source.put("updatedAt", (updated == null ? created : updated).toLocalDateTime().toLocalDate().toString());
                }
                return new Snapshot(work.projectId(), revision, source);
            }, work.projectId());
        if (rows.isEmpty()) {
            // Application deletes are soft deletes; preserve a tombstone for retained work if a row is absent.
            Long revision = jdbc.queryForObject(
                "SELECT MAX(revision) FROM project_index_outbox WHERE project_id=?", Long.class, work.projectId());
            return new Snapshot(work.projectId(), revision, Map.of("projectId", work.projectId(),
                "searchRevision", revision, "visible", false));
        }
        Snapshot snapshot = rows.get(0);
        if (Boolean.TRUE.equals(snapshot.source().get("visible"))) {
            snapshot.source().put("projectTechs", jdbc.queryForList("""
                SELECT t.code_name FROM project_tech pt JOIN tech_code t ON t.id=pt.tech_code_id
                WHERE pt.project_post_id=? ORDER BY t.id
                """, String.class, work.projectId()));
        }
        if (snapshot.revision() < work.revision() || snapshot.revision() < 1) {
            throw new IllegalStateException("PROJECT_INDEX_REVISION_INVALID");
        }
        return snapshot;
    }

    public void attempted(Work work) {
        jdbc.update("""
            UPDATE project_index_outbox SET attempts=attempts+1, attempted_at=CURRENT_TIMESTAMP(6)
            WHERE id=? AND status IN ('PENDING','RETRY')
            """, work.id());
    }

    public void succeeded(Work work) {
        jdbc.update("""
            UPDATE project_index_outbox SET status='SUCCEEDED', last_error=NULL, processed_at=CURRENT_TIMESTAMP(6)
            WHERE id=?
            """, work.id());
    }

    public void failed(Work work, String safeError, long backoffSeconds) {
        jdbc.update("""
            UPDATE project_index_outbox SET status='RETRY', last_error=?,
                next_attempt_at=TIMESTAMPADD(SECOND, ?, CURRENT_TIMESTAMP(6)), processed_at=NULL WHERE id=?
            """, safeError, backoffSeconds, work.id());
    }
}
