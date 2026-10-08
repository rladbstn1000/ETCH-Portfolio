package com.ssafy.etch.demo;

import com.ssafy.etch.company.controller.CompanyController;
import com.ssafy.etch.company.dto.CompanyInfoDTO;
import com.ssafy.etch.company.service.CompanyService;
import com.ssafy.etch.file.repository.FileRepository;
import com.ssafy.etch.global.service.S3Service;
import com.ssafy.etch.like.repository.LikeRepository;
import com.ssafy.etch.member.dto.MemberDTO;
import com.ssafy.etch.member.entity.MemberEntity;
import com.ssafy.etch.member.repository.MemberRepository;
import com.ssafy.etch.oauth.jwt.util.JWTUtil;
import com.ssafy.etch.project.controller.ProjectController;
import com.ssafy.etch.project.entity.ProjectEntity;
import com.ssafy.etch.project.event.ProjectViewCountChangedEvent;
import com.ssafy.etch.project.repository.ProjectRepository;
import com.ssafy.etch.project.repository.ProjectTechRepository;
import com.ssafy.etch.project.service.ProjectServiceImpl;
import com.ssafy.etch.search.controller.JobSearchController;
import com.ssafy.etch.search.controller.NewsSearchController;
import com.ssafy.etch.search.controller.ProjectSearchController;
import com.ssafy.etch.search.service.JobSearchService;
import com.ssafy.etch.search.service.NewsSearchService;
import com.ssafy.etch.search.service.ProjectSearchService;
import com.ssafy.etch.tech.repository.TechCodeRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.test.web.servlet.MockMvc;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Real demo filter, controller, detail service and DTO projection. Actual MySQL/ES checks are separate deployment evidence. */
@WebMvcTest(controllers = {ProjectController.class, CompanyController.class, JobSearchController.class,
    NewsSearchController.class, ProjectSearchController.class, PublicDemoHealthController.class},
    properties = "spring.jwt.secret=synthetic-test-only-long-jwt-key-not-for-deployment-01234567890123456789")
@ActiveProfiles("public-demo")
@RecordApplicationEvents
@Import({PublicDemoSecurityConfig.class, PublicDemoResponseAdvice.class, PublicDemoExceptionHandler.class,
    ProjectServiceImpl.class, JWTUtil.class})
class PublicDemoIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired JWTUtil jwt;
    @Autowired ApplicationEvents events;
    @MockitoBean ProjectRepository projects;
    @MockitoBean LikeRepository likes;
    @MockitoBean MemberRepository members;
    @MockitoBean TechCodeRepository techCodes;
    @MockitoBean ProjectTechRepository projectTechs;
    @MockitoBean FileRepository files;
    @MockitoBean S3Service storage;
    @MockitoBean CompanyService companies;
    @MockitoBean JobSearchService jobSearch;
    @MockitoBean NewsSearchService newsSearch;
    @MockitoBean ProjectSearchService projectSearch;

    @BeforeEach void fixtures() {
        MemberEntity owner = MemberEntity.toMemberEntity(MemberDTO.builder().id(9001L).nickname("synthetic writer")
            .email("never-public@example.invalid").phoneNumber("private-phone").birth("2000-01-01")
            .refreshToken("never-public-refresh").role("USER").build());
        when(projects.findById(9001L)).thenReturn(Optional.of(ProjectEntity.builder()
            .title("synthetic project").content("synthetic content").isPublic(true).member(owner).build()));
        when(projects.findById(9002L)).thenReturn(Optional.of(ProjectEntity.builder()
            .title("private project").content("never-public-body").isPublic(false).member(owner).build()));
        ProjectEntity deleted = ProjectEntity.builder().title("deleted project").content("never-public-body")
            .isPublic(true).member(owner).build();
        org.springframework.test.util.ReflectionTestUtils.setField(deleted, "isDeleted", true);
        when(projects.findById(9003L)).thenReturn(Optional.of(deleted));
        when(newsSearch.search(any(), anyInt(), anyInt())).thenReturn(Page.empty());
        when(jobSearch.searchWithFilters(any(), any(), any(), any(), any(), anyInt(), anyInt())).thenReturn(Page.empty());
    }

    @Test void repeatedAnonymousAndSignedGetAndHeadAreReadOnly() throws Exception {
        String token = token();
        for (int i = 0; i < 5; i++) {
            mvc.perform(get("/projects/9001").header("Authorization", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.title").value("synthetic project"))
                .andExpect(jsonPath("$.data.viewCount").value(0)).andExpect(jsonPath("$.data.nickname").value("synthetic writer"))
                .andExpect(jsonPath("$.data.memberId").doesNotExist()).andExpect(jsonPath("$.data.member").doesNotExist())
                .andExpect(jsonPath("$.data.profileUrl").doesNotExist()).andExpect(jsonPath("$.data.email").doesNotExist())
                .andExpect(jsonPath("$.data.likedByMe").doesNotExist()).andExpect(header().doesNotExist("Set-Cookie"));
            mvc.perform(get("/projects/9001")).andExpect(status().isOk());
            mvc.perform(head("/projects/9001")).andExpect(status().isOk());
            mvc.perform(head("/projects/9001").header("Authorization", token)).andExpect(status().isOk());
        }
        verify(projects, never()).findLockedById(anyLong());
        verify(projects, never()).increaseViewCount(anyLong());
        verify(projects, never()).save(any());
        verify(likes, never()).existsByMember_IdAndTargetIdAndType(anyLong(), anyLong(), any());
        verifyNoInteractions(members, storage, projectTechs);
        assertThat(events.stream(ProjectViewCountChangedEvent.class)).isEmpty();
    }

    @Test void privateMissingAndDeletedDetailsCannotUseOwnerJwt() throws Exception {
        for (String path : new String[]{"/projects/9002", "/projects/9003", "/projects/9999"}) {
            mvc.perform(get(path)).andExpect(status().isNotFound());
            mvc.perform(get(path).header("Authorization", token())).andExpect(status().isNotFound());
            mvc.perform(head(path).header("Authorization", token())).andExpect(status().isNotFound());
        }
        verify(projects, never()).increaseViewCount(anyLong());
        assertThat(events.stream(ProjectViewCountChangedEvent.class)).isEmpty();
    }

    @Test void allUnlistedMethodsAndRoutesAreDeniedEvenWithSignedJwt() throws Exception {
        String[] paths = {"/projects", "/projects/my", "/members", "/members/me", "/likes/projects", "/appliedJobs/list",
            "/portfolios/list", "/projects/9001/comments", "/jobs/expiring", "/news/latest", "/news/top-companies",
            "/oauth2/authorization/google", "/login/oauth2/code/google", "/auth/reissue", "/swagger-ui/index.html",
            "/v3/api-docs", "/actuator/health", "/actuator/env", "/admin/repair", "/enqueue", "/retention", "/dlq",
            "/error", "/does-not-exist", "/health/extra"};
        for (String path : paths) {
            mvc.perform(get(path)).andExpect(status().isForbidden()).andExpect(header().doesNotExist("Set-Cookie"));
            mvc.perform(get(path).header("Authorization", token())).andExpect(status().isForbidden());
        }
        for (String path : new String[]{"/projects/9001", "/members/me", "/likes/projects", "/auth/reissue", "/health", "/search"}) {
            mvc.perform(post(path)).andExpect(status().isForbidden());
            mvc.perform(post(path).header("Authorization", token())).andExpect(status().isForbidden());
            mvc.perform(put(path).header("Authorization", token())).andExpect(status().isForbidden());
            mvc.perform(delete(path).header("Authorization", token())).andExpect(status().isForbidden());
            mvc.perform(patch(path).header("Authorization", token())).andExpect(status().isForbidden());
        }
        mvc.perform(options("/search")).andExpect(status().isForbidden());
        verifyNoInteractions(projects, members, storage, jobSearch, newsSearch);
    }

    @Test void minimalHealthAndNoCrossOriginCredentialHeaders() throws Exception {
        mvc.perform(get("/health").header("Origin", "https://untrusted.invalid").cookie(new jakarta.servlet.http.Cookie("refresh", "unused")))
            .andExpect(status().isOk()).andExpect(content().json("{\"status\":\"UP\"}"))
            .andExpect(header().doesNotExist("Access-Control-Allow-Credentials")).andExpect(header().doesNotExist("Set-Cookie"))
            .andExpect(header().string("X-Content-Type-Options", "nosniff")).andExpect(header().string("X-Frame-Options", "DENY"));
        mvc.perform(head("/health")).andExpect(status().isOk());
    }

    @Test void invalidInputsAre400BeforeSearchAndDoNotEchoInput() throws Exception {
        String[] queries = {"page=-1", "page=20", "size=0", "size=101", "page=19&size=100", "page=x", "page=2147483647",
            "unknown=hello", "keyword=one&keyword=two"};
        for (String query : queries) mvc.perform(get("/news/search?" + query)).andExpect(status().isBadRequest());
        mvc.perform(get("/news/search").param("keyword", "\u0000")).andExpect(status().isBadRequest());
        mvc.perform(get("/news/search").param("keyword", "가".repeat(101))).andExpect(status().isBadRequest());
        mvc.perform(get("/jobs/search").param("regions", "<script>internal</script>"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("잘못된 입력입니다."));
        mvc.perform(get("/jobs/search").param("jobCategories", "가,나,다,라,마,바,사,아,자")).andExpect(status().isBadRequest());
        mvc.perform(get("/projects/search").param("sort", "SCORE")).andExpect(status().isBadRequest());
        mvc.perform(get("/projects/search").param("category", "UNKNOWN")).andExpect(status().isBadRequest());
        mvc.perform(get("/projects/999999999999999999999999")).andExpect(status().isBadRequest());
        mvc.perform(get("/news/companies/1").param("page", "0")).andExpect(status().isBadRequest());
        verifyNoInteractions(newsSearch, jobSearch, projectSearch, projects);
    }

    @Test void validZeroQuoteAndBoundedUnknownFilterRemainSearchRequests() throws Exception {
        mvc.perform(get("/news/search").param("keyword", "Spring \"quote\"").param("size", "100"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.content").isEmpty());
        mvc.perform(get("/news/search").param("keyword", "가".repeat(100))).andExpect(status().isOk());
        mvc.perform(get("/jobs/search").param("regions", "서").param("jobCategories", "DevOps/클라우드"))
            .andExpect(status().isOk());
        verify(newsSearch).search("Spring \"quote\"", 0, 100);
        verify(jobSearch).searchWithFilters(null, java.util.List.of("서"), java.util.List.of("DevOps/클라우드"), null, null, 0, 10);
    }

    @Test void dependencyFailureAndInternalExceptionHideDetails() throws Exception {
        when(newsSearch.search(any(), anyInt(), anyInt())).thenThrow(new org.springframework.dao.DataAccessResourceFailureException("http://private-es:9200 secret-value"));
        mvc.perform(get("/news/search").param("keyword", "Spring")).andExpect(status().isServiceUnavailable())
            .andExpect(jsonPath("$.message").value("데이터 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요."));
        doThrow(new RuntimeException("internal-secret")).when(newsSearch).search(any(), anyInt(), anyInt());
        mvc.perform(get("/news/search").param("keyword", "Spring")).andExpect(status().isInternalServerError())
            .andExpect(jsonPath("$.message").value("서버 내부 오류가 발생했습니다."));
    }

    @Test void companyProjectionContainsOnlyDisplayedPublicFields() throws Exception {
        when(companies.getCompanyInfo(1L)).thenReturn(CompanyInfoDTO.builder().id(1L).name("synthetic company")
            .address("unneeded address").stock("unneeded stock").homepageUrl("https://unused.invalid").maleEmployees(7L).build());
        mvc.perform(get("/companies/1")).andExpect(status().isOk()).andExpect(jsonPath("$.data.name").value("synthetic company"))
            .andExpect(jsonPath("$.data.address").doesNotExist()).andExpect(jsonPath("$.data.stock").doesNotExist())
            .andExpect(jsonPath("$.data.homepageUrl").doesNotExist()).andExpect(jsonPath("$.data.maleEmployees").doesNotExist());
    }

    private String token() { return "Bearer " + jwt.createJwt("access", "synthetic@example.invalid", "USER", 9001L, 60000L); }
}
