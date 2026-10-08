package com.ssafy.etch.security;

import tools.jackson.databind.ObjectMapper;
import com.ssafy.etch.comment.controller.CommentController;
import com.ssafy.etch.comment.repository.CommentRepository;
import com.ssafy.etch.comment.service.CommentServiceImpl;
import com.ssafy.etch.file.repository.FileRepository;
import com.ssafy.etch.global.config.SecurityConfig;
import com.ssafy.etch.global.exception.CustomException;
import com.ssafy.etch.global.exception.ErrorCode;
import com.ssafy.etch.global.service.S3Service;
import com.ssafy.etch.global.util.CookieUtil;
import com.ssafy.etch.member.service.MemberService;
import com.ssafy.etch.oauth.controller.AuthController;
import com.ssafy.etch.oauth.service.AuthServiceImpl;
import jakarta.servlet.http.Cookie;
import com.ssafy.etch.like.repository.LikeRepository;
import com.ssafy.etch.member.dto.MemberDTO;
import com.ssafy.etch.member.entity.MemberEntity;
import com.ssafy.etch.member.repository.MemberRepository;
import com.ssafy.etch.oauth.handler.CustomOAuth2FailureHandler;
import com.ssafy.etch.oauth.handler.CustomSuccessHandler;
import com.ssafy.etch.oauth.jwt.filter.JwtExceptionFilter;
import com.ssafy.etch.oauth.jwt.util.JWTUtil;
import com.ssafy.etch.oauth.service.CustomOAuth2UserService;
import com.ssafy.etch.portfolio.controller.PortfolioController;
import com.ssafy.etch.portfolio.dto.PortfolioDTO;
import com.ssafy.etch.portfolio.entity.PortfolioEntity;
import com.ssafy.etch.portfolio.repository.PortfolioProjectRepository;
import com.ssafy.etch.portfolio.repository.PortfolioRepository;
import com.ssafy.etch.portfolio.service.PortfolioServiceImpl;
import com.ssafy.etch.project.controller.ProjectController;
import com.ssafy.etch.project.entity.ProjectEntity;
import com.ssafy.etch.project.repository.ProjectRepository;
import com.ssafy.etch.project.repository.ProjectTechRepository;
import com.ssafy.etch.project.service.ProjectServiceImpl;
import com.ssafy.etch.tech.repository.TechCodeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Real controllers, services, JWT parsing and SecurityFilterChain; persistence is isolated for deterministic authorization tests. */
@org.springframework.test.context.event.RecordApplicationEvents
@WebMvcTest(controllers = {ProjectController.class, PortfolioController.class, CommentController.class, AuthController.class},
    properties = "app.features.oauth-enabled=false")
@Import({SecurityConfig.class, JWTUtil.class, JwtExceptionFilter.class,
    ProjectServiceImpl.class, PortfolioServiceImpl.class, CommentServiceImpl.class, AuthServiceImpl.class, CookieUtil.class})
class AuthorizationIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired JWTUtil jwt;
    @Autowired ObjectMapper mapper;
    @Autowired org.springframework.test.context.event.ApplicationEvents events;
    @MockitoBean CustomOAuth2UserService oauthUserService;
    @MockitoBean CustomSuccessHandler successHandler;
    @MockitoBean CustomOAuth2FailureHandler failureHandler;
    @MockitoBean ProjectRepository projects;
    @MockitoBean PortfolioRepository portfolios;
    @MockitoBean PortfolioProjectRepository portfolioProjects;
    @MockitoBean MemberRepository members;
    @MockitoBean MemberService memberService;
    @MockitoBean LikeRepository likes;
    @MockitoBean TechCodeRepository techCodes;
    @MockitoBean ProjectTechRepository projectTechs;
    @MockitoBean FileRepository files;
    @MockitoBean S3Service storage;
    @MockitoBean CommentRepository comments;

    private MemberEntity owner;
    private PortfolioEntity portfolio;
    private static final String UPDATE = "{\"name\":\"updated\",\"introduce\":\"synthetic\",\"techList\":[],\"projectIds\":[]}";

    @BeforeEach void fixtures() {
        owner = member(9001L);
        when(members.findById(Long.valueOf(9001L))).thenReturn(Optional.of(owner));
        when(members.findById(Long.valueOf(9002L))).thenReturn(Optional.of(member(9002L)));
        when(projects.findLockedById(9001L)).thenReturn(Optional.of(project(true)));
        when(projects.findLockedById(9002L)).thenReturn(Optional.of(project(false)));
        when(projects.findById(9002L)).thenReturn(Optional.of(project(false)));
        when(projects.increaseViewCount(anyLong())).thenReturn(1);
        portfolio = PortfolioEntity.from(PortfolioDTO.builder().id(9001L).member(owner)
            .name("original").introduce("synthetic").techList("[]").project(new ArrayList<>()).build());
        when(portfolios.findById(9001L)).thenReturn(Optional.of(portfolio));
    }

    @Test void anonymousCanReadPublicProject() throws Exception {
        mvc.perform(get("/projects/9001")).andExpect(status().isOk()).andExpect(jsonPath("$.data.title").value("synthetic project"));
        verify(projects).increaseViewCount(9001L);
    }

    @Test void normalHeadStillIncrementsViewAndPublishesOutboxSourceEvent() throws Exception {
        mvc.perform(head("/projects/9001").header("Authorization", token(9001L, "USER"))).andExpect(status().isOk());
        verify(projects).findLockedById(9001L);
        verify(projects).increaseViewCount(9001L);
        assertThat(events.stream(com.ssafy.etch.project.event.ProjectViewCountChangedEvent.class).count()).isEqualTo(1);
    }

    @Test void anonymousCannotReadPrivateProjectOrIncrementViews() throws Exception {
        mvc.perform(get("/projects/9002")).andExpect(status().isUnauthorized());
        verify(projects, never()).increaseViewCount(anyLong());
        verifyNoInteractions(files, likes);
    }

    @Test void ownerCanReadPrivateProject() throws Exception {
        mvc.perform(get("/projects/9002").header("Authorization", token(9001L, "USER")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.isPublic").value(false));
        verify(projects).increaseViewCount(9002L);
    }

    @Test void anotherUserCannotReadPrivateProjectOrIncrementViews() throws Exception {
        mvc.perform(get("/projects/9002").header("Authorization", token(9002L, "USER"))).andExpect(status().isForbidden());
        verify(projects, never()).increaseViewCount(anyLong());
    }

    @Test void privateCommentsFollowProjectVisibility() throws Exception {
        mvc.perform(get("/projects/9002/comments")).andExpect(status().isUnauthorized());
        mvc.perform(get("/projects/9002/comments").header("Authorization", token(9002L, "USER"))).andExpect(status().isForbidden());
        verifyNoInteractions(comments);
    }

    @Test void privateRoutesAndWritesRequireAuthentication() throws Exception {
        for (String path : new String[]{"/projects/my", "/portfolios/list", "/members/me", "/likes/jobs", "/appliedJobs/list"}) {
            mvc.perform(get(path)).andExpect(status().isUnauthorized());
        }
        mvc.perform(put("/portfolios/9001").contentType(MediaType.APPLICATION_JSON).content(UPDATE)).andExpect(status().isUnauthorized());
        mvc.perform(delete("/projects/9001")).andExpect(status().isUnauthorized());
        verifyNoInteractions(portfolios);
    }

    @Test void guestCannotAccessPersonalDataOrWrite() throws Exception {
        mvc.perform(get("/portfolios/list").header("Authorization", token(null, "GUEST"))).andExpect(status().isForbidden());
        mvc.perform(put("/portfolios/9001").header("Authorization", token(null, "GUEST"))
            .contentType(MediaType.APPLICATION_JSON).content(UPDATE)).andExpect(status().isForbidden());
    }

    @Test void portfolioOwnerCanUpdate() throws Exception {
        mvc.perform(put("/portfolios/9001").header("Authorization", token(9001L, "USER"))
            .contentType(MediaType.APPLICATION_JSON).content(UPDATE)).andExpect(status().isOk());
        assertThat(portfolio.toPortfolioDTO().getName()).isEqualTo("updated");
        verify(portfolioProjects).deleteByPortfolioId(9001L);
    }

    @Test void anotherUserCannotUpdatePortfolio() throws Exception {
        mvc.perform(put("/portfolios/9001").header("Authorization", token(9002L, "USER"))
            .contentType(MediaType.APPLICATION_JSON).content(UPDATE)).andExpect(status().isForbidden());
        assertThat(portfolio.toPortfolioDTO().getName()).isEqualTo("original");
        verifyNoInteractions(portfolioProjects);
    }

    @Test void deletedPortfolioCannotBeUpdated() throws Exception {
        portfolio.updateStatus();
        mvc.perform(put("/portfolios/9001").header("Authorization", token(9001L, "USER"))
            .contentType(MediaType.APPLICATION_JSON).content(UPDATE)).andExpect(status().isNotFound());
        verifyNoInteractions(portfolioProjects);
    }

    @Test void portfolioCannotEmbedAnotherUsersPrivateProject() throws Exception {
        String update = UPDATE.replace("\"projectIds\":[]", "\"projectIds\":[9002]");
        when(projects.findById(9002L)).thenReturn(Optional.of(ProjectEntity.builder()
            .title("other private").content("private").isPublic(false).member(member(9002L)).build()));
        mvc.perform(put("/portfolios/9001").header("Authorization", token(9001L, "USER"))
            .contentType(MediaType.APPLICATION_JSON).content(update)).andExpect(status().isForbidden());
        verify(portfolioProjects, never()).save(any());
    }

    @Test void invalidExpiredAndRefreshTokensCannotAuthenticate() throws Exception {
        for (String token : new String[]{"Bearer malformed", "Bearer ", "Basic invalid",
                "Bearer " + jwt.createJwt("access", "synthetic@example.invalid", "USER", 9001L, -1000L),
                "Bearer " + jwt.createJwt("refresh", "synthetic@example.invalid", "USER", 9001L, 60000L)}) {
            mvc.perform(get("/projects/9001").header("Authorization", token)).andExpect(status().isUnauthorized());
        }
    }

    @Test void missingProjectReturns404() throws Exception {
        mvc.perform(get("/projects/9999")).andExpect(status().isNotFound());
    }

    @Test void refreshMissingMalformedExpiredAndAccessTokenReturn401() throws Exception {
        mvc.perform(post("/auth/reissue")).andExpect(status().isUnauthorized());
        for (String value : new String[]{"malformed",
                jwt.createJwt("refresh", "synthetic@example.invalid", "USER", 9001L, -1000L),
                jwt.createJwt("access", "synthetic@example.invalid", "USER", 9001L, 60000L)}) {
            mvc.perform(post("/auth/reissue").cookie(new Cookie("refresh", value))).andExpect(status().isUnauthorized());
        }
        verifyNoInteractions(memberService);
    }

    @Test void signedRefreshMustMatchStoredRefreshToken() throws Exception {
        String refresh = jwt.createJwt("refresh", "synthetic@example.invalid", "USER", 9001L, 60000L);
        when(memberService.findById(9001L)).thenReturn(MemberDTO.builder().id(9001L).role("USER").refreshToken("different").build());
        mvc.perform(post("/auth/reissue").cookie(new Cookie("refresh", refresh))).andExpect(status().isUnauthorized());
        verify(memberService, never()).updateRefreshToken(anyLong(), anyString());
    }

    @Test void removedMemberCannotRefresh() throws Exception {
        String refresh = jwt.createJwt("refresh", "synthetic@example.invalid", "USER", 9001L, 60000L);
        for (ErrorCode reason : new ErrorCode[]{ErrorCode.USER_NOT_FOUND, ErrorCode.USER_WITHDRAWN}) {
            doThrow(new CustomException(reason)).when(memberService).findById(9001L);
            mvc.perform(post("/auth/reissue").cookie(new Cookie("refresh", refresh))).andExpect(status().isUnauthorized());
        }
        verify(memberService, never()).updateRefreshToken(anyLong(), anyString());
    }

    @Test void ownerCanRefreshWithStoredTokenAndReceivesHttpOnlyCookie() throws Exception {
        String refresh = jwt.createJwt("refresh", "synthetic@example.invalid", "USER", 9001L, 60000L);
        when(memberService.findById(9001L)).thenReturn(MemberDTO.builder().id(9001L).email("synthetic@example.invalid").role("USER").refreshToken(refresh).build());
        mvc.perform(post("/auth/reissue").cookie(new Cookie("refresh", refresh)))
            .andExpect(status().isOk()).andExpect(header().exists("Authorization"))
            .andExpect(cookie().httpOnly("refresh", true)).andExpect(cookie().secure("refresh", true));
    }

    private String token(Long id, String role) {
        return "Bearer " + jwt.createJwt("access", "synthetic@example.invalid", role, id, 60000L);
    }
    private ProjectEntity project(boolean visible) {
        return ProjectEntity.builder().title("synthetic project").content("synthetic").isPublic(visible).member(owner).build();
    }
    private MemberEntity member(Long id) {
        return MemberEntity.toMemberEntity(MemberDTO.builder().id(id).nickname("synthetic" + id)
            .email("synthetic" + id + "@example.invalid").birth("2000-01-01").role("USER").build());
    }
}
