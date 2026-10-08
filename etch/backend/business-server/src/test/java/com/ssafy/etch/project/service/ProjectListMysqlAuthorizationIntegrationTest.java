package com.ssafy.etch.project.service;

import com.ssafy.etch.demo.PublicDemoExceptionHandler;
import com.ssafy.etch.demo.PublicDemoResponseAdvice;
import com.ssafy.etch.demo.PublicDemoSecurityConfig;
import com.ssafy.etch.file.repository.FileRepository;
import com.ssafy.etch.global.config.SecurityConfig;
import com.ssafy.etch.global.exception.GlobalExceptionHandler;
import com.ssafy.etch.global.service.S3Service;
import com.ssafy.etch.like.repository.LikeRepository;
import com.ssafy.etch.member.repository.MemberRepository;
import com.ssafy.etch.oauth.handler.CustomOAuth2FailureHandler;
import com.ssafy.etch.oauth.handler.CustomSuccessHandler;
import com.ssafy.etch.oauth.jwt.filter.JwtExceptionFilter;
import com.ssafy.etch.oauth.jwt.util.JWTUtil;
import com.ssafy.etch.oauth.service.CustomOAuth2UserService;
import com.ssafy.etch.project.controller.ProjectController;
import com.ssafy.etch.project.repository.ProjectRepository;
import com.ssafy.etch.search.indexing.ProjectIndexOutbox;
import com.ssafy.etch.search.indexing.ProjectIndexStore;
import com.ssafy.etch.search.listener.ProjectViewCountSync;
import com.ssafy.etch.tech.repository.TechCodeRepository;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.hibernate.autoconfigure.HibernateJpaAutoConfiguration;
import org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration;
import org.springframework.boot.jdbc.autoconfigure.JdbcTemplateAutoConfiguration;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.transaction.autoconfigure.TransactionAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.head;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Opt-in MockMvc + actual MySQL/JPA regression, separate from SQL-count measurements.
 * Uses the isolated fixture prepared by the project-list MySQL runner, never seeds/reset data here.
 * Normal successful detail reads intentionally commit view/revision/outbox changes; run after measurement.
 * Only unused OAuth collaborators are mocked. No repository, query, aggregate or search snapshot is mocked.
 */
@EnabledIfEnvironmentVariable(named = "ETCH_PROJECT_MYSQL_RUN", matches = "1")
class ProjectListMysqlAuthorizationIntegrationTest extends ProjectListMysqlWebSupport {
    @Test void anonymousListPreservesJsonVisibilityBoundsAndBusinessState() throws Exception {
        var before = businessState();
        for (int pageSize : new int[]{1, 3, 10, 30, 100}) {
            var result = mvc.perform(get("/projects").param("sort", "latest").param("pageSize", Integer.toString(pageSize)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalElements").value(205))
                .andExpect(jsonPath("$.data.content.length()").value(pageSize))
                .andExpect(jsonPath("$.data.currentPage").value(1))
                .andExpect(jsonPath("$.data.last").value(false)).andReturn();
            var data = mapper.readTree(result.getResponse().getContentAsString()).get("data");
            assertThat(data.propertyNames()).containsExactlyInAnyOrder("content", "currentPage", "last", "totalElements", "totalPages");
            for (var project : data.get("content")) {
                assertThat(project.propertyNames()).containsExactlyInAnyOrder("id", "title", "thumbnailUrl", "projectCategory", "viewCount", "likeCount", "nickname", "isPublic", "popularityScore");
                assertThat(project.get("id").longValue()).isBetween(1L, 205L);
                assertThat(project.get("id").isIntegralNumber()).isTrue();
                assertThat(project.get("likeCount").isIntegralNumber()).isTrue();
                assertThat(project.get("isPublic").booleanValue()).isTrue();
            }
        }
        mvc.perform(get("/projects").param("page", "0").param("pageSize", "0"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.currentPage").value(1))
            .andExpect(jsonPath("$.data.content.length()").value(1));
        mvc.perform(get("/projects").param("pageSize", "10001"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.content.length()").value(100));
        assertThat(businessState()).isEqualTo(before);
    }

    @Test void deniedPrivateAndDeletedDetailsHaveNoWriteEffects() throws Exception {
        var before = businessState();
        mvc.perform(get("/projects/206")).andExpect(status().isUnauthorized());
        mvc.perform(get("/projects/206").header("Authorization", token(2L))).andExpect(status().isForbidden());
        for (long id : new long[]{207, 208, 999999}) {
            mvc.perform(get("/projects/" + id)).andExpect(status().isNotFound());
            mvc.perform(get("/projects/" + id).header("Authorization", token(1L))).andExpect(status().isNotFound());
        }
        assertThat(businessState()).isEqualTo(before);
    }

    @Test void allowedPublicAndOwnerDetailsRetainCounterOutboxAndSnapshotPath() throws Exception {
        for (long id : new long[]{1, 206}) {
            long oldViews = number("SELECT view_count FROM project_post WHERE id=?", id);
            long oldRevision = number("SELECT search_revision FROM project_post WHERE id=?", id);
            long oldOutbox = number("SELECT COUNT(*) FROM project_index_outbox WHERE project_id=?", id);
            var request = get("/projects/" + id);
            if (id == 206) request.header("Authorization", token(1L));
            mvc.perform(request).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(id))
                .andExpect(jsonPath("$.data.isPublic").value(id == 1))
                .andExpect(jsonPath("$.data.viewCount").value(oldViews + 1));
            assertThat(number("SELECT view_count FROM project_post WHERE id=?", id)).isEqualTo(oldViews + 1);
            assertThat(number("SELECT search_revision FROM project_post WHERE id=?", id)).isEqualTo(oldRevision + 1);
            assertThat(number("SELECT COUNT(*) FROM project_index_outbox WHERE project_id=?", id)).isEqualTo(oldOutbox + 1);
            var beforeSnapshot = businessState();
            var snapshot = snapshots.snapshot(new ProjectIndexStore.Work(-1, id, oldRevision + 1, 0));
            assertThat(snapshot.revision()).isEqualTo(oldRevision + 1);
            assertThat(snapshot.source().get("visible")).isEqualTo(id == 1);
            if (id == 1) {
                assertThat(snapshot.source().get("viewCount")).isEqualTo(oldViews + 1);
                assertThat(((Number) snapshot.source().get("likeCount")).longValue())
                    .isEqualTo(number("SELECT COUNT(*) FROM liked_content WHERE type='PROJECT' AND targetId=?", id));
            } else {
                assertThat(snapshot.source().keySet()).containsExactlyInAnyOrder("projectId", "searchRevision", "visible");
            }
            assertThat(businessState()).isEqualTo(beforeSnapshot);
        }
    }
}

@EnabledIfEnvironmentVariable(named = "ETCH_PROJECT_MYSQL_RUN", matches = "1")
@ActiveProfiles("public-demo")
class ProjectListMysqlPublicDemoAuthorizationIntegrationTest extends ProjectListMysqlWebSupport {
    @Test void publicDemoKeepsDatabaseListDeniedEvenWithOwnerJwt() throws Exception {
        var before = businessState();
        mvc.perform(get("/projects")).andExpect(status().isForbidden());
        mvc.perform(get("/projects").header("Authorization", token(1L)))
            .andExpect(status().isForbidden()).andExpect(header().doesNotExist("Set-Cookie"));
        assertThat(businessState()).isEqualTo(before);
    }

    @Test void demoDetailProjectionAndReadOnlyPolicyUseActualMysql() throws Exception {
        var before = businessState();
        long views = number("SELECT view_count FROM project_post WHERE id=1");
        for (boolean signed : List.of(false, true)) {
            var request = get("/projects/1");
            if (signed) request.header("Authorization", token(1L));
            mvc.perform(request).andExpect(status().isOk()).andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.viewCount").value(views))
                .andExpect(jsonPath("$.data.member").doesNotExist()).andExpect(jsonPath("$.data.memberId").doesNotExist())
                .andExpect(jsonPath("$.data.email").doesNotExist()).andExpect(jsonPath("$.data.profileUrl").doesNotExist())
                .andExpect(jsonPath("$.data.likedByMe").doesNotExist()).andExpect(header().doesNotExist("Set-Cookie"));
            mvc.perform(head("/projects/1").header("Authorization", token(1L))).andExpect(status().isOk());
            for (long id : new long[]{206, 207, 208, 999999}) {
                var hidden = get("/projects/" + id);
                if (signed) hidden.header("Authorization", token(1L));
                mvc.perform(hidden).andExpect(status().isNotFound());
            }
        }
        assertThat(businessState()).isEqualTo(before);
    }
}

@WebMvcTest(controllers = ProjectController.class, properties = {
    "spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver",
    "spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect",
    "spring.jpa.hibernate.ddl-auto=validate", "spring.sql.init.mode=never",
    "spring.jpa.hibernate.naming.physical-strategy=org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl",
    "spring.jpa.open-in-view=false", "spring.jpa.show-sql=false",
    "spring.jpa.properties.hibernate.cache.use_second_level_cache=false",
    "spring.jpa.properties.hibernate.cache.use_query_cache=false",
    "app.features.oauth-enabled=false", "app.features.storage-enabled=false",
    "app.features.recommendations-enabled=false", "app.project-indexing.enabled=false",
    "spring.jwt.secret=project-list-mysql-synthetic-test-only-key-012345678901234567890123456789"
})
@ImportAutoConfiguration({DataSourceAutoConfiguration.class, HibernateJpaAutoConfiguration.class,
    JdbcTemplateAutoConfiguration.class, TransactionAutoConfiguration.class})
@Import({ProjectListMysqlWebSupport.MysqlJpaConfiguration.class,
    SecurityConfig.class, PublicDemoSecurityConfig.class, JWTUtil.class, JwtExceptionFilter.class,
    ProjectServiceImpl.class, S3Service.class, GlobalExceptionHandler.class,
    PublicDemoResponseAdvice.class, PublicDemoExceptionHandler.class,
    ProjectIndexOutbox.class, ProjectViewCountSync.class, ProjectIndexStore.class})
abstract class ProjectListMysqlWebSupport {
    @Autowired MockMvc mvc;
    @Autowired JWTUtil jwt;
    @Autowired ObjectMapper mapper;
    @Autowired JdbcTemplate jdbc;
    @Autowired ProjectIndexStore snapshots;
    @MockitoBean CustomOAuth2UserService oauthUserService;
    @MockitoBean CustomSuccessHandler successHandler;
    @MockitoBean CustomOAuth2FailureHandler failureHandler;

    @DynamicPropertySource static void database(DynamicPropertyRegistry properties) {
        String url = required("ETCH_PROJECT_MYSQL_URL");
        if (!url.matches("jdbc:mysql://(?:mysql:3306|127\\.0\\.0\\.1:33087)/etch_project_list(?:\\?.*)?")) {
            throw new IllegalStateException("Only the dedicated etch_project_list fixture database is permitted");
        }
        properties.add("spring.datasource.url", () -> url);
        properties.add("spring.datasource.username", () -> required("ETCH_PROJECT_MYSQL_USER"));
        properties.add("spring.datasource.password", () -> required("ETCH_PROJECT_MYSQL_PASSWORD"));
    }

    private static String required(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) throw new IllegalStateException("Missing isolated MySQL test setting: " + name);
        return value;
    }

    @BeforeEach void requireIsolatedFixture() {
        assertThat(jdbc.queryForObject("SELECT DATABASE()", String.class)).isEqualTo("etch_project_list");
        assertThat(number("SELECT COUNT(*) FROM project_post")).isEqualTo(210);
        assertThat(number("SELECT COUNT(*) FROM project_post WHERE is_public=1 AND is_deleted=0")).isEqualTo(205);
        assertThat(number("SELECT member_id FROM project_post WHERE id=206 AND is_public=0 AND is_deleted=0")).isEqualTo(1);
    }

    String token(Long memberId) {
        return "Bearer " + jwt.createJwt("access", "synthetic@example.invalid", "USER", memberId, 60_000L);
    }

    long number(String sql, Object... args) { return jdbc.queryForObject(sql, Long.class, args); }

    Map<String, Object> businessState() {
        return Map.of(
            "projects", jdbc.queryForList("SELECT id,member_id,title,content,thumbnail_url,youtube_url,view_count,category,created_at,updated_at,HEX(is_deleted) AS deleted_flag,HEX(is_public) AS public_flag,github_url,search_revision FROM project_post ORDER BY id"),
            "likes", jdbc.queryForList("SELECT id,member_id,targetId,type FROM liked_content ORDER BY id"),
            "outbox", jdbc.queryForList("SELECT * FROM project_index_outbox ORDER BY id"));
    }

    @TestConfiguration(proxyBeanMethods = false)
    @EntityScan("com.ssafy.etch")
    @EnableJpaRepositories(basePackageClasses = {ProjectRepository.class, LikeRepository.class,
        MemberRepository.class, TechCodeRepository.class, FileRepository.class})
    static class MysqlJpaConfiguration {}
}
