package com.ssafy.etch.security;

import com.ssafy.etch.global.util.CookieUtil;
import com.ssafy.etch.member.dto.MemberDTO;
import com.ssafy.etch.member.repository.MemberRepository;
import com.ssafy.etch.oauth.dto.CustomOAuth2User;
import com.ssafy.etch.oauth.handler.CustomSuccessHandler;
import com.ssafy.etch.oauth.jwt.util.JWTUtil;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.net.URI;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class AuthTransportTest {
    @Test void refreshCookieDistinguishesLocalHttpAndDeploymentHttps() {
        var local = new CookieUtil(false, "/api/v1").createCookie("refresh", "synthetic");
        var deployed = new CookieUtil(true, "/api/v1").createCookie("refresh", "synthetic");
        assertThat(local.getSecure()).isFalse();
        assertThat(deployed.getSecure()).isTrue();
        assertThat(local.isHttpOnly()).isTrue();
        assertThat(deployed.getAttribute("SameSite")).isEqualTo("Lax");
        assertThat(local.getPath()).isEqualTo("/api/v1");
    }

    @Test void oauthRedirectUsesFragmentAndDisablesCaching() throws Exception {
        var jwt = new JWTUtil("synthetic-test-key-with-at-least-32-characters");
        var handler = new CustomSuccessHandler(jwt, mock(MemberRepository.class), new CookieUtil(false, "/api/v1"), "http://localhost:5173/Oauth");
        var user = new CustomOAuth2User(MemberDTO.builder().email("guest@example.invalid").role("GUEST").build());
        var response = new MockHttpServletResponse();
        handler.onAuthenticationSuccess(new MockHttpServletRequest(), response,
            new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
        URI redirect = URI.create(response.getRedirectedUrl());
        assertThat(redirect.getQuery()).isNull();
        assertThat(redirect.getFragment()).startsWith("token=");
        assertThat(jwt.getRole(redirect.getFragment().substring("token=".length()))).isEqualTo("GUEST");
        assertThat(response.getHeader("Cache-Control")).isEqualTo("no-store");
        assertThat(response.getHeader("Referrer-Policy")).isEqualTo("no-referrer");
    }
}
