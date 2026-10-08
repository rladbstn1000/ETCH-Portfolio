package com.ssafy.etch.oauth.service;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public interface AuthService {
    void reissueToken(HttpServletRequest request, HttpServletResponse response);
}
