package com.ssafy.etch.global.json;

import com.ssafy.etch.coverLetter.dto.CoverLetterRequestDTO;
import com.ssafy.etch.global.response.ApiResponse;
import com.ssafy.etch.global.config.ElasticsearchJsonConfig;
import com.ssafy.etch.job.dto.JobDTO;
import com.ssafy.etch.like.dto.LikeRequestDTO;
import com.ssafy.etch.oauth.jwt.util.JWTUtil;
import com.ssafy.etch.portfolio.dto.PortfolioRequestDTO;
import com.ssafy.etch.project.dto.ProjectCreateRequestDTO;
import com.ssafy.etch.project.dto.ProjectUpdateRequestDTO;
import com.ssafy.etch.project.entity.ProjectCategory;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.io.StringWriter;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.jackson.autoconfigure.JacksonAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import tools.jackson.databind.ObjectMapper;
import static org.assertj.core.api.Assertions.*;

/** Exercise the actual Boot HTTP mapper, distinct from JJWT's Jackson 2 serializer. */
class JsonContractTest {
    private final ApplicationContextRunner context = new ApplicationContextRunner()
        .withConfiguration(AutoConfigurations.of(JacksonAutoConfiguration.class));

    @Test void responseKeepsIsoDatesNullFieldsAndIntegralIds() {
        context.run(app -> {
            ObjectMapper mapper = app.getBean(ObjectMapper.class);
            var date = LocalDateTime.of(2026, 9, 29, 12, 34, 56);
            var body = mapper.readTree(mapper.writeValueAsString(ApiResponse.success(JobDTO.builder()
                .id(9007199254740993L).title("한글 \"quote\"").openingDate(date)
                .createdAt(LocalDate.of(2026, 9, 29)).build())));
            assertThat(body.get("success").booleanValue()).isTrue();
            assertThat(body.has("message")).isTrue();
            assertThat(body.get("message").isNull()).isTrue();
            var data = body.get("data");
            assertThat(data.get("id").isIntegralNumber()).isTrue();
            assertThat(data.get("id").longValue()).isEqualTo(9007199254740993L);
            assertThat(data.get("openingDate").stringValue()).isEqualTo("2026-09-29T12:34:56");
            assertThat(data.get("createdAt").stringValue()).isEqualTo("2026-09-29");
            assertThat(data.get("expirationDate").isNull()).isTrue();
            assertThat(mapper.readTree(mapper.writeValueAsString(ApiResponse.error("오류"))))
                .isEqualTo(mapper.readTree("{\"success\":false,\"data\":null,\"message\":\"오류\"}"));
        });
    }

    @Test void normalRequestDtosKeepObjectAndEnumBinding() {
        context.run(app -> {
            ObjectMapper mapper = app.getBean(ObjectMapper.class);
            String category = ProjectCategory.values()[0].name();
            String project = "{\"title\":\"synthetic\",\"content\":\"body\",\"projectCategory\":\"" + category
                + "\",\"techCodeIds\":[1],\"isPublic\":true}";
            assertThat(mapper.readValue(project, ProjectCreateRequestDTO.class).getProjectCategory().name()).isEqualTo(category);
            assertThat(mapper.readValue(project, ProjectUpdateRequestDTO.class).getIsPublic()).isTrue();
            assertThat(mapper.readValue("{\"name\":\"portfolio\",\"techList\":[],\"projectIds\":[9001]}",
                PortfolioRequestDTO.class).getProjectIds()).containsExactly(9001L);
            assertThat(mapper.readValue("{\"name\":\"letter\",\"answer1\":null}", CoverLetterRequestDTO.class).getName()).isEqualTo("letter");
            assertThat(mapper.readValue("{\"targetId\":9001}", LikeRequestDTO.class).getTargetId()).isEqualTo(9001L);
            assertThatThrownBy(() -> mapper.readValue(project.replace(category, "NOT_A_CATEGORY"), ProjectCreateRequestDTO.class))
                .isInstanceOf(tools.jackson.core.JacksonException.class);
        });
    }

    @Test void elasticClientAutoConfigurationUsesJackson3WithoutContactingServer() {
        context.withConfiguration(AutoConfigurations.of(
            org.springframework.boot.elasticsearch.autoconfigure.ElasticsearchRestClientAutoConfiguration.class,
            org.springframework.boot.elasticsearch.autoconfigure.ElasticsearchClientAutoConfiguration.class))
            .withUserConfiguration(ElasticsearchJsonConfig.class)
            .withPropertyValues("spring.elasticsearch.uris=http://127.0.0.1:1")
            .run(app -> {
                assertThat(app).hasNotFailed();
                assertThat(app.getBean(co.elastic.clients.json.JsonpMapper.class))
                    .isInstanceOf(co.elastic.clients.json.jackson.Jackson3JsonpMapper.class);
                assertThat(app).hasSingleBean(co.elastic.clients.elasticsearch.ElasticsearchClient.class);
                assertThat(app).doesNotHaveBean(com.fasterxml.jackson.databind.ObjectMapper.class);
            });
    }

    @Test void elasticIndexRequestOmitsNullMapContentWhileHttpKeepsNull() {
        context.withUserConfiguration(ElasticsearchJsonConfig.class).run(app -> {
            var mapper = app.getBean(co.elastic.clients.json.JsonpMapper.class);
            ObjectMapper http = app.getBean(ObjectMapper.class);
            Map<String, Object> source = new LinkedHashMap<>();
            source.put("projectId", 43001L);
            source.put("searchRevision", 1L);
            source.put("visible", true);
            source.put("thumbnailUrl", null);
            var request = co.elastic.clients.elasticsearch.core.IndexRequest.of(builder -> builder
                .index("project-v2").id("43001").version(1L)
                .versionType(co.elastic.clients.elasticsearch._types.VersionType.ExternalGte).document(source));
            StringWriter output = new StringWriter();
            try (var generator = mapper.jsonProvider().createGenerator(output)) {
                request.serialize(generator, mapper);
            }
            assertThat(http.readTree(output.toString()))
                .isEqualTo(http.readTree("{\"projectId\":43001,\"searchRevision\":1,\"visible\":true}"));
            assertThat(http.readTree(http.writeValueAsString(source)).get("thumbnailUrl").isNull()).isTrue();
        });
    }

    @Test void bothJacksonLinesRejectOversizedXmlDurationBeforeNumberParsing() {
        // A small bounded regression payload exercises CVE-2026-68497 without an expensive DoS probe.
        String oversized = "\"P" + "9".repeat(1001) + "Y\"";
        context.run(app -> {
            ObjectMapper mapper = app.getBean(ObjectMapper.class);
            assertThat(mapper.readValue("\"P1Y\"", javax.xml.datatype.Duration.class).getYears()).isEqualTo(1);
            assertThatThrownBy(() -> mapper.readValue(oversized, javax.xml.datatype.Duration.class))
                .isInstanceOf(tools.jackson.core.JacksonException.class);
        });
        var jwtCompatibilityMapper = new com.fasterxml.jackson.databind.ObjectMapper();
        assertThatThrownBy(() -> jwtCompatibilityMapper.readValue(oversized, javax.xml.datatype.Duration.class))
            .isInstanceOf(com.fasterxml.jackson.core.JsonProcessingException.class);
    }

    @Test void signedJwtKeepsSeparateJackson2BoundaryAndLongClaim() {
        var jwt = new JWTUtil("synthetic-unit-test-signature-key-longer-than-32-bytes");
        String token = jwt.createJwt("access", "fixture@example.invalid", "USER", 9007199254740993L, 60000L);
        assertThat(jwt.getId(token)).isEqualTo(9007199254740993L);
        assertThat(jwt.getRole(token)).isEqualTo("USER");
        assertThat(jwt.getCategory(token)).isEqualTo("access");
    }
}
