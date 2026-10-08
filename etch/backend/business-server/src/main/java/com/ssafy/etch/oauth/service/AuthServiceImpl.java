package com.ssafy.etch.oauth.service;

import com.ssafy.etch.global.exception.CustomException;
import com.ssafy.etch.global.exception.ErrorCode;
import com.ssafy.etch.global.util.CookieUtil;
import com.ssafy.etch.member.dto.MemberDTO;
import com.ssafy.etch.member.service.MemberService;
import com.ssafy.etch.oauth.jwt.util.JWTUtil;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final JWTUtil jwtUtil;
    private final MemberService memberService;
    private final CookieUtil cookieUtil;

    @Override
    public void reissueToken(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = CookieUtil.getCookieValue(request.getCookies(), "refresh");

        if (refreshToken == null) {
            throw new CustomException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        Long id;
        try {
            if (!"refresh".equals(jwtUtil.getCategory(refreshToken))) {
                throw new CustomException(ErrorCode.REFRESH_TOKEN_INVALID);
            }
            id = jwtUtil.getId(refreshToken);
            if (id == null) {
                throw new CustomException(ErrorCode.REFRESH_TOKEN_INVALID);
            }
        } catch (ExpiredJwtException exception) {
            throw new CustomException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        } catch (JwtException | IllegalArgumentException exception) {
            throw new CustomException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        MemberDTO memberDTO;
        try {
            memberDTO = memberService.findById(id);
        } catch (CustomException exception) {
            if (exception.getErrorCode() == ErrorCode.USER_NOT_FOUND || exception.getErrorCode() == ErrorCode.USER_WITHDRAWN) {
                throw new CustomException(ErrorCode.REFRESH_TOKEN_INVALID);
            }
            throw exception;
        }
        if (!refreshToken.equals(memberDTO.getRefreshToken())) {
            throw new CustomException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        if (memberDTO.isDeleted() || !"USER".equals(memberDTO.getRole())) {
            throw new CustomException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        // 새로운 액세스 토큰 발급
        String newAccessToken = jwtUtil.createJwt("access", memberDTO.getEmail(), memberDTO.getRole(), memberDTO.getId(), 30 * 60 * 1000L); // 30분

        // 새로운 리프레시 토큰도 발급
        String newRefreshToken = jwtUtil.createJwt("refresh", memberDTO.getEmail(), memberDTO.getRole(), memberDTO.getId(), 24 * 60 * 60 * 1000L); // 1일

        // DB에 리프레시 토큰 업데이트
        memberService.updateRefreshToken(memberDTO.getId(), newRefreshToken);

        // 응답 헤더에 새로운 액세스 토큰 추가
        response.setHeader("Authorization", newAccessToken);
        // 쿠키로 전달
        Cookie refreshCookie = cookieUtil.createCookie("refresh", newRefreshToken);
        response.addCookie(refreshCookie);
    }
}

