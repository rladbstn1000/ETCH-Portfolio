package com.ssafy.etch.project.service;

import com.ssafy.etch.global.response.PageResponseDTO;
import com.ssafy.etch.global.service.S3Service;
import com.ssafy.etch.like.dto.LikeDTO;
import com.ssafy.etch.like.entity.LikeEntity;
import com.ssafy.etch.like.entity.LikeType;
import com.ssafy.etch.member.dto.MemberDTO;
import com.ssafy.etch.member.entity.MemberEntity;
import com.ssafy.etch.project.controller.ProjectController;
import com.ssafy.etch.project.dto.ProjectListDTO;
import com.ssafy.etch.project.entity.ProjectCategory;
import com.ssafy.etch.project.entity.ProjectEntity;
import jakarta.persistence.EntityManager;
import org.hibernate.resource.jdbc.spi.StatementInspector;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/** Actual controller/service/repositories and Hibernate SQL; an isolated H2 DB, never ETCH's MySQL. */
@DataJpaTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:project-list-query;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.jpa.hibernate.naming.physical-strategy=org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl",
    "spring.jpa.properties.hibernate.session_factory.statement_inspector=com.ssafy.etch.project.service.ProjectListQueryIntegrationTest$SqlCapture",
    "spring.jpa.show-sql=false"
}, showSql = false)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(ProjectServiceImpl.class)
class ProjectListQueryIntegrationTest {
    @Autowired EntityManager em;
    @Autowired ProjectServiceImpl service;
    @MockitoBean S3Service storage;
    private final ObjectMapper mapper = JsonMapper.builder().findAndAddModules().build();

    @Test void publicListKeepsItsResponseWithoutPerRowLikeCountQueries() throws Exception {
        seed();
        ProjectController controller = new ProjectController(service, mapper);
        List<Map<String, Object>> observations = new ArrayList<>();
        // Sorting, later/empty pages, and the existing page/size bounds all use the real call path.
        List<Request> requests = List.of(
            new Request("popular", 1, 3, List.of(1L, 4L, 3L)),
            new Request("views", 1, 3, List.of(1L, 2L, 3L)),
            new Request("latest", 1, 3, List.of(4L, 3L, 2L)),
            new Request("latest", 2, 3, List.of(1L)),
            new Request("latest", 3, 3, List.of()),
            new Request("views", 0, 0, List.of(1L)),
            new Request("views", 1, 10001, List.of(1L, 2L, 3L, 4L)));

        for (Request request : requests) {
            em.clear(); // No first-level-cache advantage between requests or before/after runs.
            SqlCapture.reset();
            var response = controller.getAllProjects(request.sort(), request.page(), request.size());
            var json = mapper.readTree(mapper.writeValueAsString(response.getBody()));
            List<String> sql = SqlCapture.snapshot();
            PageResponseDTO<ProjectListDTO> data = response.getBody().getData();
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(data.getContent()).extracting(ProjectListDTO::getId).isEqualTo(request.ids());
            assertThat(data.getTotalElements()).isEqualTo(4);
            int boundedSize = Math.min(100, Math.max(1, request.size()));
            assertThat(data.getTotalPages()).isEqualTo((4 + boundedSize - 1) / boundedSize);
            assertThat(data.getCurrentPage()).isEqualTo(Math.max(1, request.page()));
            assertThat(data.isLast()).isEqualTo(Math.max(1, request.page()) >= data.getTotalPages());
            for (ProjectListDTO project : data.getContent()) {
                int index = project.getId().intValue() - 1;
                assertThat(project.getTitle()).isEqualTo("synthetic-project-" + project.getId());
                assertThat(project.getProjectCategory()).isEqualTo(ProjectCategory.WEB);
                assertThat(project.getThumbnailUrl()).isNull();
                assertThat(project.getNickname()).isEqualTo(index % 2 == 0 ? "synthetic-author-a" : "synthetic-author-b");
                assertThat(project.getIsPublic()).isTrue();
                assertThat(project.getViewCount()).isEqualTo(4L - index);
                assertThat(project.getLikeCount()).isEqualTo(new long[]{2, 0, 1, 3}[index]);
                assertThat(project.getPopularityScore()).isEqualTo(new double[]{16, 6, 8, 14}[index]);
            }
            Map<String, Object> observed = new LinkedHashMap<>();
            observed.put("request", Map.of("path", "/projects", "sort", request.sort(), "page", request.page(), "pageSize", request.size()));
            observed.put("response", json);
            observed.put("sqlStatementCount", sql.size());
            observed.put("standaloneLikeCountQueries", sql.stream().filter(SqlCapture::isLikeCount).count());
            observed.put("sql", sql);
            observations.add(observed);
        }

        Path report = Path.of(System.getenv().getOrDefault("ETCH_PROJECT_QUERY_REPORT", "build/reports/project-list-query.json"));
        Files.createDirectories(report.toAbsolutePath().getParent());
        Files.writeString(report, mapper.writerWithDefaultPrettyPrinter().writeValueAsString(Map.of(
            "database", "H2 MySQL mode (test scope only)",
            "path", "ProjectController.getAllProjects -> ProjectServiceImpl.getAllProjects -> actual JPA repositories",
            "requests", observations,
            "limitations", List.of("SQL round trips, not DB rows scanned or production latency", "Existing author lazy loads and correlated Formula subqueries remain", "Security is covered separately by AuthorizationIntegrationTest and PublicDemoIntegrationTest"))) + "\n");
        assertThat(observations).allSatisfy(row -> assertThat(row.get("standaloneLikeCountQueries")).isEqualTo(0L));
    }

    private void seed() {
        MemberEntity authorA = author("a");
        MemberEntity authorB = author("b");
        em.persist(authorA);
        em.persist(authorB);
        int[] likes = {2, 0, 1, 3, 2, 2};
        for (int index = 0; index < 6; index++) {
            ProjectEntity project = ProjectEntity.builder().title("synthetic-project-" + (index + 1))
                .content("public regression fixture").projectCategory(ProjectCategory.WEB)
                .isPublic(index != 4).member(index % 2 == 0 ? authorA : authorB).build();
            em.persist(project);
            em.flush();
            em.createNativeQuery("update project_post set created_at = :created, view_count = :views, is_deleted = :deleted where id = :id")
                .setParameter("created", java.time.LocalDateTime.of(2026, 1, index + 1, 0, 0))
                .setParameter("views", 4 - index).setParameter("deleted", index == 5)
                .setParameter("id", project.getId()).executeUpdate();
            for (int count = 0; count < likes[index]; count++) {
                em.persist(LikeEntity.from(LikeDTO.builder().targetId(project.getId()).type(LikeType.PROJECT).build(),
                    count % 2 == 0 ? authorA : authorB));
            }
        }
        // Identical target ID in another content type must not affect the project's count.
        em.persist(LikeEntity.from(LikeDTO.builder().targetId(1L).type(LikeType.JOB).build(), authorA));
        em.flush();
        em.clear();
    }

    private MemberEntity author(String suffix) {
        return MemberEntity.toMemberEntity(MemberDTO.builder().nickname("synthetic-author-" + suffix)
            .email("synthetic-" + suffix + "@example.invalid").gender("synthetic")
            .phoneNumber("synthetic-phone-" + suffix)
            .birth("2000-01-01").role("USER").refreshToken("synthetic-not-a-token").build());
    }

    private record Request(String sort, int page, int size, List<Long> ids) {}

    public static class SqlCapture implements StatementInspector {
        private static final ThreadLocal<List<String>> SQL = ThreadLocal.withInitial(ArrayList::new);
        @Override public String inspect(String sql) { SQL.get().add(sql); return sql; }
        static void reset() { SQL.get().clear(); }
        static List<String> snapshot() { return List.copyOf(SQL.get()); }
        static boolean isLikeCount(String sql) {
            return sql.toLowerCase().matches("select count\\(.*") && sql.contains(" from liked_content ");
        }
    }
}
