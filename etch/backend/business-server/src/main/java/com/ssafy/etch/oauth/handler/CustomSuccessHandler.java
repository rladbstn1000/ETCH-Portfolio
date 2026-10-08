package com.ssafy.etch.oauth.handler;

import com.ssafy.etch.global.util.CookieUtil;
import com.ssafy.etch.member.entity.MemberEntity;
import com.ssafy.etch.member.repository.MemberRepository;
import com.ssafy.etch.oauth.dto.CustomOAuth2User;
import com.ssafy.etch.oauth.jwt.util.JWTUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;

@Component
public class CustomSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    private final JWTUtil jwtUtil;
    private final MemberRepository memberRepository;
    private final CookieUtil cookieUtil;
    private final String frontendCallbackUrl;

    public CustomSuccessHandler(JWTUtil jwtUtil, MemberRepository memberRepository, CookieUtil cookieUtil,
                                @Value("${app.auth.frontend-callback-url:http://localhost:5173/Oauth}") String frontendCallbackUrl) {
        this.jwtUtil = jwtUtil;
        this.memberRepository = memberRepository;
        this.cookieUtil = cookieUtil;
        this.frontendCallbackUrl = frontendCallbackUrl;
    }

    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {

        // OAuth2User
        CustomOAuth2User customUserDetails = (CustomOAuth2User) authentication.getPrincipal();

        String email = customUserDetails.getEmail();
        String role = customUserDetails.getRole();

        String accessToken = null;
        if ("USER".equals(role)) {
            Long id = customUserDetails.getId();
            // 액세스 토큰 및 리프레시 토큰 생성
            accessToken = jwtUtil.createJwt("access", email, role, id, 30 * 60 * 1000L); // 30분
            String refreshToken = jwtUtil.createJwt("refresh", email, role, id,  24 * 60 * 60 * 1000L); // 24시간

            // DB에 리프레시 토큰 저장
            memberRepository.findById(id).ifPresent(memberEntity -> MemberEntity.updateRefreshToken(memberEntity, refreshToken));

            response.addCookie(cookieUtil.createCookie("refresh", refreshToken));
        } else if ("GUEST".equals(role)) {
            accessToken = jwtUtil.createJwt("access", email, role, null, 30 * 60 * 1000L); // 30분                                               │
        }
        if (accessToken == null) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN);
            return;
        }
        // Fragments are not sent in HTTP requests or Referer headers; the SPA consumes and clears this immediately.
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("Referrer-Policy", "no-referrer");
        String redirectUrl = frontendCallbackUrl + "#token=" + accessToken;
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
