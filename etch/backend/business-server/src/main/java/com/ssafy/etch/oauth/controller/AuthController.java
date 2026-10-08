package com.ssafy.etch.oauth.controller;

import com.ssafy.etch.global.response.ApiResponse;
import com.ssafy.etch.oauth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/reissue")
    public ResponseEntity<ApiResponse<?>> reissue(HttpServletRequest request, HttpServletResponse response) {

        authService.reissueToken(request, response);
        return ResponseEntity.ok(ApiResponse.success(null,"토큰 갱신 완료"));

    }
}

