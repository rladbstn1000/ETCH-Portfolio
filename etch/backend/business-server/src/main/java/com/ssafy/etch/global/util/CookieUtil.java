package com.ssafy.etch.global.util;

import jakarta.servlet.http.Cookie;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class CookieUtil {
    private final boolean secure;
    private final String path;

    public CookieUtil(@Value("${app.auth.cookie-secure:true}") boolean secure,
                      @Value("${app.auth.cookie-path:/api}") String path) {
        this.secure = secure;
        this.path = path;
    }

    public Cookie createCookie(String key, String value) {
        Cookie cookie = new Cookie(key, value);
        cookie.setMaxAge(24 * 60 * 60); // 1일

        cookie.setSecure(secure);
        cookie.setPath(path);
        cookie.setAttribute("SameSite", "Lax");
        // JavaScript를 통해 쿠키에 접근할 수 없도록 설정 (XSS 공격 방지)
        cookie.setHttpOnly(true);

        return cookie;
    }

    public static String getCookieValue(Cookie[] cookies, String name) {
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(name)) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}
