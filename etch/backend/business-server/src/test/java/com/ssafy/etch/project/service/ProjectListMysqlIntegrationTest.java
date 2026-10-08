package com.ssafy.etch.project.service;

import com.ssafy.etch.global.response.ApiResponse;
import com.ssafy.etch.global.response.PageResponseDTO;
import com.ssafy.etch.global.service.S3Service;
import com.ssafy.etch.like.entity.LikeType;
import com.ssafy.etch.like.repository.LikeRepository;
import com.ssafy.etch.project.controller.ProjectController;
import com.ssafy.etch.project.dto.ProjectDTO;
import com.ssafy.etch.project.dto.ProjectListDTO;
import com.ssafy.etch.project.entity.ProjectEntity;
import com.ssafy.etch.project.repository.ProjectRepository;
import jakarta.persistence.EntityManagerFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.data.domain.Sort.Direction.DESC;

/** Opt-in, actual MySQL/JPA/controller/JSON. Never points at an existing ETCH schema. */
@EnabledIfEnvironmentVariable(named = "ETCH_PROJECT_MYSQL_RUN", matches = "1")
@DataJpaTest(properties = {
    "spring.jpa.hibernate.ddl-auto=none",
    "spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect",
    "spring.jpa.hibernate.naming.physical-strategy=org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl",
    "spring.jpa.open-in-view=false",
    "spring.jpa.properties.hibernate.cache.use_second_level_cache=false",
    "spring.jpa.properties.hibernate.cache.use_query_cache=false",
    "spring.jpa.properties.hibernate.default_batch_fetch_size=0",
    "spring.jpa.properties.hibernate.query.fail_on_pagination_over_collection_fetch=true",
    "spring.jpa.show-sql=false",
    "app.project-indexing.enabled=false"
}, showSql = false)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({ProjectServiceImpl.class, MysqlQueryCapture.Config.class})
class ProjectListMysqlIntegrationTest {
    @Autowired ProjectServiceImpl service;
    @Autowired ProjectRepository projectRepository;
    @Autowired LikeRepository likeRepository;
    @Autowired PlatformTransactionManager transactionManager;
    @Autowired EntityManagerFactory emf;
    @Autowired JdbcTemplate jdbc;
    @Autowired DataSource dataSource;
    @Autowired ApplicationContext context;
    @MockitoBean S3Service storage; // Unused external storage only; no query/repository mock.
    private final ObjectMapper mapper = JsonMapper.builder().findAndAddModules().build();
    private final Map<String, String> statements = new LinkedHashMap<>();
    private final Map<String, List<MysqlQueryCapture.Execution>> representative = new LinkedHashMap<>();
    private static final int PUBLIC_COUNT = 205;
    private static final LocalDateTime START = LocalDateTime.of(2026, 1, 1, 0, 0);

    @DynamicPropertySource static void mysql(DynamicPropertyRegistry p) {
        String url = System.getenv("ETCH_PROJECT_MYSQL_URL");
        if (url == null || !url.matches("jdbc:mysql://(?:mysql:3306|127\\.0\\.0\\.1:33087)/etch_project_list(?:\\?.*)?")) {
            throw new IllegalStateException("Only the dedicated etch_project_list fixture database is permitted");
        }
        p.add("spring.datasource.url", () -> url);
        p.add("spring.datasource.username", () -> System.getenv("ETCH_PROJECT_MYSQL_USER"));
        p.add("spring.datasource.password", () -> System.getenv("ETCH_PROJECT_MYSQL_PASSWORD"));
        p.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
    }

    @Test void measureActualExecutionsAndPreserveListContract() throws Exception {
        assertThat(jdbc.queryForObject("select database()", String.class)).isEqualTo("etch_project_list");
        assertThat(jdbc.queryForObject("select version()", String.class)).startsWith("8.4.12");
        assertThat(context.containsBean("projectIndexWorker")).isFalse();
        assertThat(context.containsBean("projectIndexOutboxCleanupWorker")).isFalse();
        calibrateExecutionCounter();
        String stage = System.getenv().getOrDefault("ETCH_PROJECT_MYSQL_STAGE", "current");
        assertThat(stage).isIn("current", "improved");
        Path output = Path.of(System.getenv().getOrDefault("ETCH_PROJECT_MYSQL_REPORT_DIR", "build/reports/project-list-mysql"));
        Files.createDirectories(output);
        ProjectController controller = new ProjectController(service, mapper);
        List<Map<String, Object>> observations = new ArrayList<>();
        List<Map<String, Object>> historical = new ArrayList<>();
        List<Map<String, Object>> invariants = new ArrayList<>();
        for (boolean distinct : List.of(false, true)) {
            String scenario = distinct ? "distinct-authors" : "same-author";
            seed(distinct);
            Map<String, String> before = tableFingerprints();
            Set<String> contextProperties = emf.getProperties().keySet();
            assertThat(contextProperties).contains("hibernate.cache.use_second_level_cache");
            Map<String, JsonNode> currentResponses = new LinkedHashMap<>();
            for (Request request : requests()) {
                assertNoContext();
                MysqlQueryCapture.start();
                JsonNode response;
                List<MysqlQueryCapture.Execution> sql;
                try {
                    var result = controller.getAllProjects(request.sort, request.page, request.size);
                    assertThat(result.getStatusCode().value()).isEqualTo(200);
                    // Includes lazy loads in DTO conversion AND full JSON serialization.
                    response = mapper.readTree(mapper.writeValueAsString(result.getBody()));
                } finally { sql = MysqlQueryCapture.stop(); }
                assertNoContext();
                validateResponse(response, request, distinct);
                assertThat(sql).allSatisfy(s -> assertThat(s.success()).isTrue());
                Map<String, Long> counts = counts(sql);
                int rows = response.path("data").path("content").size();
                assertThat(counts.get("standaloneLikeCount")).isZero();
                assertThat(counts.get("other")).isZero();
                assertThat(counts.get("list")).isEqualTo(1L);
                // Last/empty page COUNT omission follows Spring Data, not a forced constant.
                long expectedCount = rows > 0 && rows < request.boundedSize() ? 0 : 1;
                assertThat(counts.get("totalCount")).isEqualTo(expectedCount);
                assertThat(counts.get("author")).isEqualTo(stage.equals("improved") ? 0L : (distinct ? rows : (rows == 0 ? 0L : 1L)));
                observations.add(observation(scenario, request, response, sql));
                currentResponses.put(request.key(), response);
                if (distinct && request.page == 1 && request.size == 100 && List.of("popular", "views", "latest").contains(request.sort)) {
                    representative.put(request.sort, sql);
                }
                if (stage.equals("current")) {
                    // Exact pre-1a13eed service path, not an invented slow implementation.
                    TransactionTemplate tx = new TransactionTemplate(transactionManager);
                    tx.setReadOnly(true);
                    MysqlQueryCapture.start();
                    JsonNode old;
                    List<MysqlQueryCapture.Execution> oldSql;
                    try {
                        old = tx.execute(status -> mapper.readTree(mapper.writeValueAsString(ApiResponse.success(
                            historicalGetAllProjects(request.sort, request.page, request.size)))));
                    } finally { oldSql = MysqlQueryCapture.stop(); }
                    assertNoContext();
                    assertThat(old).isEqualTo(response);
                    assertThat(counts(oldSql).get("standaloneLikeCount")).isEqualTo((long) rows);
                    historical.add(observation(scenario, request, old, oldSql));
                }
            }
            for (String sort : List.of("popular", "views", "latest")) {
                for (int size : List.of(30, 100)) {
                    List<Long> all = new ArrayList<>();
                    for (int page = 1; page <= (PUBLIC_COUNT + size - 1) / size; page++) {
                        currentResponses.get(new Request(sort, page, size).key()).path("data").path("content").forEach(n -> all.add(n.path("id").asLong()));
                    }
                    assertThat(all).hasSize(PUBLIC_COUNT).doesNotHaveDuplicates().containsExactlyElementsOf(orderedIds(sort));
                }
            }
            Map<String, String> after = tableFingerprints();
            assertThat(after).as("Read-only listing must not change any business, revision, outbox or sync table").isEqualTo(before);
            invariants.add(Map.of("scenario", scenario, "before", before, "after", after, "unchanged", true,
                "completePagination", "All pages for sizes 30 and 100 in three sorts; exact expected IDs on every sampled 1/3/10 page"));
            if (distinct) writePlans(output, stage);
        }
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("stage", stage);
        report.put("database", metadata());
        report.put("fixture", Map.of("publicProjects", PUBLIC_COUNT, "totalProjects", 210, "members", 205,
            "variants", List.of("same-author", "distinct-authors"), "likeCount", "id % 7, plus unrelated JOB type for target 1",
            "activeComments", "id % 3, plus one deleted comment per project", "views", "(id * 37) % 211; id 17 is NULL",
            "createdAt", "2026-01-01T00:00:00 plus id seconds", "hiddenIds", List.of(206,207,208,209,210)));
        report.put("measurement", Map.of("path", "Direct ProjectController -> real transactional service -> JPA -> DTO -> JSON (not HTTP)",
            "counting", "Actual application JDBC execute invocations; preparation/connection transaction controls are not counted, Formula subqueries remain within list SELECT",
            "context", "No outer transaction or OSIV; resource unbound before/after every request; new read-only transaction each call",
            "secondLevelCache", false, "queryCache", false, "batchFetchSize", 0,
            "workers", "DataJpaTest slice does not load schedulers; project-indexing explicitly false", "timing", "No latency improvement claim or concurrent load test; MySQL buffer pool is not reset"));
        report.put("requests", observations);
        report.put("historicalPre1a13eed", historical);
        report.put("statements", statements);
        report.put("readOnlyFingerprints", invariants);
        Files.writeString(output.resolve(stage + ".json"), mapper.writerWithDefaultPrettyPrinter().writeValueAsString(report) + "\n");
    }

    private void assertNoContext() {
        assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
        assertThat(TransactionSynchronizationManager.hasResource(emf)).isFalse();
    }

    private void calibrateExecutionCounter() throws Exception {
        MysqlQueryCapture.start();
        List<MysqlQueryCapture.Execution> captured;
        try (Connection connection = dataSource.getConnection(); PreparedStatement statement = connection.prepareStatement("select ?")) {
            statement.setInt(1, 7);
            try (ResultSet rs = statement.executeQuery()) { rs.next(); assertThat(rs.getInt(1)).isEqualTo(7); }
            statement.setNull(1, Types.INTEGER);
            try (ResultSet rs = statement.executeQuery()) { rs.next(); assertThat(rs.getObject(1)).isNull(); }
        } finally { captured = MysqlQueryCapture.stop(); }
        assertThat(captured).hasSize(2); // one preparation, two actual executions
        assertThat(captured.get(0).parameters().get(1)).isEqualTo(7);
        assertThat(captured.get(1).parameters()).containsEntry(1, null);
        assertThat(captured).allSatisfy(row -> assertThat(row.success()).isTrue());
    }

    private List<Request> requests() {
        Set<Request> result = new LinkedHashSet<>();
        for (String sort : List.of("popular", "views", "latest")) {
            for (int size : List.of(1, 3, 10, 30, 100)) {
                int last = (PUBLIC_COUNT + size - 1) / size;
                for (int page : List.of(1, 2, last, last + 1)) result.add(new Request(sort, page, size));
                if (size >= 30) for (int page = 1; page <= last; page++) result.add(new Request(sort, page, size));
            }
        }
        result.add(new Request("views", 0, 0));
        result.add(new Request("views", -5, -1));
        result.add(new Request("views", 1, 10001));
        result.add(new Request(null, 1, 3));
        result.add(new Request("", 1, 3));
        result.add(new Request("unknown", 1, 3));
        result.add(new Request("VIEWS", 1, 3));
        return List.copyOf(result);
    }

    private void seed(boolean distinct) {
        // Dedicated disposable fixture schema only; never alter constraints, indexes or triggers.
        for (String table : List.of("project_file", "project_tech", "project_tech_stack", "project_comment", "liked_content", "project_index_outbox", "project_post", "member")) jdbc.update("delete from " + table);
        for (int id = 1; id <= 205; id++) {
            jdbc.update("insert into member(id,birth,isDeleted,refreshToken,email,gender,nickname,phoneNumber,profile,role) values(?, '2000-01-01', b'0','synthetic-not-a-token',?,'synthetic',?,?,null,'USER')",
                id, "mysql-author-" + id + "@example.invalid", nickname(id), "synthetic-" + id);
        }
        for (int id = 1; id <= 210; id++) {
            Boolean visible = id == 209 ? null : id != 206;
            Boolean deleted = id == 210 ? null : (id == 207 || id == 208);
            jdbc.update("insert into project_post(id,member_id,title,content,category,view_count,created_at,updated_at,is_public,is_deleted,thumbnail_url,github_url,youtube_url,search_revision) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                id, distinct && id <= 205 ? id : 1, title(id), "fixed synthetic MySQL list fixture", id % 2 == 0 ? "WEB" : "MOBILE", views(id),
                Timestamp.valueOf(START.plusSeconds(id)), null, visible, deleted, thumbnail(id), null, null, 100L + id);
            for (int n = 0; n < id % 7; n++) jdbc.update("insert into liked_content(id,member_id,targetId,type) values(?,?,?,'PROJECT')", id * 10 + n, n + 1, id);
            for (int n = 0; n < id % 3; n++) jdbc.update("insert into project_comment(id,member_id,project_post,content,is_deleted,created_at) values(?,?,?,'synthetic comment',b'0',?)", id * 10 + n, n + 1, id, Timestamp.valueOf(START));
            jdbc.update("insert into project_comment(id,member_id,project_post,content,is_deleted,created_at) values(?,?,?,'deleted synthetic comment',b'1',?)", id * 10 + 9, 1, id, Timestamp.valueOf(START));
        }
        jdbc.update("insert into liked_content(id,member_id,targetId,type) values(99999,1,1,'JOB')");
        jdbc.update("insert into project_index_outbox(id,project_id,revision,status,attempts,next_attempt_at,created_at,processed_at) values(1,1,101,'PENDING',0,'2026-01-01','2026-01-01',null),(2,2,102,'DONE',1,'2026-01-01','2026-01-01','2026-01-02')");
    }

    private static String title(int id) { return "Synthetic React 'SQL' project " + id; }
    private static String nickname(int id) { return "가상 MySQL Author " + id; }
    private static String thumbnail(int id) { return id % 2 == 0 ? "https://example.invalid/synthetic/" + id + ".svg" : null; }
    private static Long views(int id) { return id == 17 ? null : (long) (id * 37 % 211); }
    private static double score(int id) { return id % 7 * 4 + id % 3 * 3 + (views(id) == null ? 0 : views(id) * 2); }
    private static String normalized(String sort) {
        if (sort == null || sort.isBlank()) return "popular";
        return Set.of("views", "latest").contains(sort.toLowerCase()) ? sort.toLowerCase() : "popular";
    }
    private List<Long> orderedIds(String sort) {
        Comparator<Integer> comparator = switch (normalized(sort)) {
            case "latest" -> Comparator.<Integer>naturalOrder().reversed();
            case "views" -> Comparator.comparing((Integer i) -> views(i), Comparator.nullsLast(Comparator.reverseOrder())).thenComparing(Comparator.reverseOrder());
            default -> Comparator.<Integer>comparingDouble(ProjectListMysqlIntegrationTest::score).reversed().thenComparing(Comparator.reverseOrder());
        };
        return IntStream.rangeClosed(1, PUBLIC_COUNT).boxed().sorted(comparator).map(Integer::longValue).toList();
    }
    private void validateResponse(JsonNode json, Request request, boolean distinct) {
        int size = request.boundedSize(), page = request.boundedPage();
        List<Long> ids = orderedIds(request.sort).stream().skip((long) (page - 1) * size).limit(size).toList();
        List<Map<String,Object>> expected = ids.stream().map(id -> {
            Map<String,Object> row = new LinkedHashMap<>(); int i = id.intValue();
            row.put("id", id); row.put("title", title(i)); row.put("thumbnailUrl", thumbnail(i));
            row.put("projectCategory", i % 2 == 0 ? "WEB" : "MOBILE"); row.put("viewCount", views(i));
            row.put("likeCount", (long) (i % 7)); row.put("nickname", nickname(distinct ? i : 1));
            row.put("isPublic", true); row.put("popularityScore", score(i)); return row;
        }).toList();
        Map<String,Object> data = Map.of("content", expected, "totalElements", PUBLIC_COUNT,
            "totalPages", (PUBLIC_COUNT + size - 1) / size, "currentPage", page, "last", page >= (PUBLIC_COUNT + size - 1) / size);
        Map<String,Object> envelope = new LinkedHashMap<>(); envelope.put("success", true); envelope.put("data", data); envelope.put("message", null);
        assertThat(json).isEqualTo(mapper.readTree(mapper.writeValueAsString(envelope)));
        json.path("data").path("content").forEach(row -> {
            assertThat(row.path("id").isIntegralNumber()).isTrue();
            assertThat(row.path("likeCount").isIntegralNumber()).isTrue();
            assertThat(row.path("isPublic").isBoolean()).isTrue();
            assertThat(row.path("popularityScore").isFloatingPointNumber()).isTrue();
            assertThat(row.size()).isEqualTo(9);
        });
    }
    private Map<String,Object> observation(String scenario, Request request, JsonNode response, List<MysqlQueryCapture.Execution> sql) {
        Map<String,Object> row = new LinkedHashMap<>();
        row.put("scenario", scenario); row.put("request", request); row.put("returned", response.path("data").path("content").size());
        row.put("distinctAuthors", StreamSupport.stream(response.path("data").path("content").spliterator(), false).map(n -> n.path("nickname").asString()).distinct().count());
        row.put("response", response); row.put("responseSha256", hash(mapper.writeValueAsBytes(response))); row.put("executedCount", sql.size()); row.put("counts", counts(sql));
        row.put("executions", sql.stream().map(s -> {
            String key = hash(s.sql().getBytes(StandardCharsets.UTF_8)); statements.put(key, s.sql());
            return Map.of("statement", key, "parameters", s.parameters(), "jdbcMethod", s.jdbcMethod(), "success", s.success());
        }).toList());
        return row;
    }
    private Map<String,Long> counts(List<MysqlQueryCapture.Execution> executions) {
        Map<String,Long> counts = new LinkedHashMap<>();
        for (String key : List.of("list", "totalCount", "author", "standaloneLikeCount", "other")) counts.put(key, 0L);
        for (var execution : executions) {
            String sql = execution.sql().replaceAll("\\s+", " ").trim().toLowerCase(Locale.ROOT);
            String kind = sql.startsWith("select count(") && sql.contains(" from liked_content ") ? "standaloneLikeCount"
                : sql.startsWith("select count(") && sql.contains(" from project_post ") ? "totalCount"
                : sql.contains(" from project_post ") && sql.startsWith("select ") ? "list"
                : sql.contains(" from member ") && sql.startsWith("select ") ? "author" : "other";
            counts.compute(kind, (key, n) -> n + 1);
        }
        return counts;
    }
    private Map<String,String> tableFingerprints() {
        Map<String,String> result = new TreeMap<>();
        for (String table : jdbc.queryForList("select table_name from information_schema.tables where table_schema=database() and table_type='BASE TABLE' order by table_name", String.class)) {
            assertThat(table).matches("[a-zA-Z0-9_]+");
            List<String> rows = jdbc.queryForList("select * from `" + table + "`").stream().map(mapper::writeValueAsString).sorted().toList();
            result.put(table, hash(String.join("\n", rows).getBytes(StandardCharsets.UTF_8)));
        }
        return result;
    }
    private Map<String,Object> metadata() throws Exception {
        Map<String,Object> result = new LinkedHashMap<>();
        result.put("settings", jdbc.queryForMap("select version() version, @@version_comment versionComment, @@lower_case_table_names lowerCaseTableNames, @@collation_database collationDatabase, @@collation_connection collationConnection, @@character_set_database charsetDatabase, @@sql_mode sqlMode, @@transaction_isolation transactionIsolation, @@time_zone timeZone, @@system_time_zone systemTimeZone, @@innodb_buffer_pool_size bufferPoolBytes"));
        result.put("columns", jdbc.queryForList("select table_name,column_name,column_type,is_nullable,collation_name from information_schema.columns where table_schema=database() and table_name in ('member','project_post','liked_content','project_comment','project_index_outbox') order by table_name,ordinal_position"));
        result.put("indexes", jdbc.queryForList("select table_name,index_name,non_unique,seq_in_index,column_name from information_schema.statistics where table_schema=database() and table_name in ('member','project_post','liked_content','project_comment') order by table_name,index_name,seq_in_index"));
        result.put("triggers", jdbc.queryForList("select trigger_name,event_manipulation,event_object_table,action_timing from information_schema.triggers where trigger_schema=database() order by trigger_name"));
        result.put("typeProbes", jdbc.queryForMap("select (select is_public from project_post where id=1) publicBit,(select created_at from project_post where id=1) createdDatetime,(select count(*) from liked_content where targetId=1 and type='PROJECT') likes,(_utf8mb4'React' collate utf8mb4_bin = _utf8mb4'react') caseEqual"));
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement(); ResultSet rs = s.executeQuery("select is_public,created_at,(select count(*) from liked_content where targetId=1 and type='PROJECT') countValue from project_post where id=1")) {
            rs.next(); Map<String,String> classes = new LinkedHashMap<>();
            for (int i = 1; i <= 3; i++) classes.put(rs.getMetaData().getColumnLabel(i), rs.getObject(i).getClass().getName());
            result.put("jdbcTypes", classes); result.put("driver", c.getMetaData().getDriverName() + " " + c.getMetaData().getDriverVersion());
        }
        return result;
    }
    private void writePlans(Path output, String stage) throws Exception {
        for (var entry : representative.entrySet()) {
            var execution = entry.getValue().stream().filter(s -> counts(List.of(s)).get("list") == 1L).findFirst().orElseThrow();
            assertThat(execution.sql().stripLeading().toLowerCase(Locale.ROOT)).startsWith("select ");
            String name = stage + "-distinct-" + entry.getKey() + "-100";
            Files.writeString(output.resolve(name + ".sql"), "-- Captured prepared list SELECT, binds: " + mapper.writeValueAsString(execution.parameters()) + "\n" + execution.sql() + ";\n");
            for (String prefix : List.of("EXPLAIN FORMAT=JSON ", "EXPLAIN ANALYZE ")) {
                try (Connection c = dataSource.getConnection(); PreparedStatement p = c.prepareStatement(prefix + execution.sql())) {
                    for (var bind : execution.parameters().entrySet()) p.setObject(bind.getKey(), bind.getValue());
                    try (ResultSet rs = p.executeQuery()) {
                        StringBuilder text = new StringBuilder(); while (rs.next()) text.append(rs.getString(1)).append('\n');
                        Files.writeString(output.resolve(name + (prefix.contains("ANALYZE") ? ".analyze.txt" : ".explain.json")), text);
                    }
                }
            }
        }
    }
    private static String hash(byte[] value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value)); }
        catch (Exception e) { throw new IllegalStateException(e); }
    }
    record Request(String sort, int page, int size) {
        int boundedPage() { return Math.max(1, page); }
        int boundedSize() { return Math.min(100, Math.max(1, size)); }
        String key() { return sort + ":" + page + ":" + size; }
    }

    // Transcribed getAllProjects body from 1a13eed^, source SHA in the old H2 evidence:
    // d3d81746aabf6d6fdaace1a0975e9fd22dd3e610b12d07f707efdd9f7758e2fa.
    // Only method name/MAX_PAGE_SIZE literal differ; runs only with unmodified current repository.
    private PageResponseDTO<ProjectListDTO> historicalGetAllProjects(String sort, int page, int pageSize) {
        final String effectiveSort = (sort == null || sort.isBlank()) ? "popular" : sort.toLowerCase();
        final int pageIndex = Math.max(0, page - 1);
        final int size = Math.min(Math.max(1, pageSize), 100);
        Sort sortOption = switch (effectiveSort) {
            case "views" -> Sort.by(DESC, "viewCount").and(Sort.by(DESC, "createdAt"));
            case "latest" -> Sort.by(DESC, "createdAt");
            default -> Sort.by(DESC, "popularityScore").and(Sort.by(DESC, "createdAt"));
        };
        Pageable pageable = PageRequest.of(pageIndex, size, sortOption);
        Page<ProjectEntity> projectPage = projectRepository.findByIsDeletedFalseAndIsPublicTrue(pageable);
        Page<ProjectListDTO> dtoPage = projectPage.map(projectEntity -> {
            ProjectDTO projectDTO = projectEntity.toProjectDTO();
            long likeCount = likeRepository.countByTargetIdAndType(projectDTO.getId(), LikeType.PROJECT);
            return ProjectListDTO.builder().id(projectDTO.getId()).title(projectDTO.getTitle())
                .projectCategory(projectDTO.getProjectCategory()).thumbnailUrl(projectDTO.getThumbnailUrl())
                .viewCount(projectDTO.getViewCount()).likeCount(likeCount)
                .nickname(projectDTO.getMember().toMemberDTO().getNickname())
                .isPublic(projectDTO.getIsPublic()).popularityScore(projectDTO.getPopularityScore()).build();
        });
        return new PageResponseDTO<>(dtoPage);
    }
}
