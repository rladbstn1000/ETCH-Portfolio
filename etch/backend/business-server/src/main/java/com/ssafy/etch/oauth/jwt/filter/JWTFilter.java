package com.ssafy.etch.oauth.jwt.filter;

import com.ssafy.etch.member.dto.MemberDTO;
import com.ssafy.etch.oauth.dto.CustomOAuth2User;
import com.ssafy.etch.oauth.jwt.util.JWTUtil;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class JWTFilter extends OncePerRequestFilter {

    private final JWTUtil jwtUtil;

    public JWTFilter(JWTUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        // "/auth/reissue" 경로로 오는 요청은 필터를 건너뛰도록 처리
        if (request.getRequestURI().equals("/auth/reissue")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 헤더에서 "access" 토큰을 찾음
        String accessToken = extractToken(request);

        // 액세스 토큰이 없는 경우 다음 필터로 넘김
        if (accessToken == null) {
            filterChain.doFilter(request, response);
            return;
        }

        // 토큰이 "access" 카테고리인지 확인 (리프레시 토큰으로 API 접근 방지)
        String category = jwtUtil.getCategory(accessToken);
        if (!"access".equals(category)) {
            throw new JwtException("Invalid token category");
        }

        // 토큰에서 id와 role 추출
        Long id = -1L;
        String email = jwtUtil.getEmail(accessToken);
        String role = jwtUtil.getRole(accessToken);
        if("USER".equals(role)) {
            id = jwtUtil.getId(accessToken);
        }

        if (!("USER".equals(role) || "GUEST".equals(role)) || ("USER".equals(role) && id == null)) {
            throw new JwtException("Invalid token claims");
        }

        // MemberDTO 생성
        MemberDTO memberDTO = MemberDTO.builder()
                .id(id)
                .email(email)
                .role(role)
                .build();

        // CustomOAuth2User 객체 생성
        CustomOAuth2User customOAuth2User = new CustomOAuth2User(memberDTO);

        // Spring Security 인증 토큰 생성
        Authentication authToken = new UsernamePasswordAuthenticationToken(customOAuth2User, null, customOAuth2User.getAuthorities());
        // SecurityContext에 인증 정보 설정
        SecurityContextHolder.getContext().setAuthentication(authToken);

        filterChain.doFilter(request, response);
    }

    public String extractToken(HttpServletRequest request) {
        String authorizationHeader = request.getHeader("Authorization");

        if (authorizationHeader == null) {
            return null;
        }
        if (!authorizationHeader.startsWith("Bearer ") || authorizationHeader.substring(7).isBlank()) {
            throw new JwtException("Invalid Authorization header");
        }
        return authorizationHeader.substring(7);
    }
}
