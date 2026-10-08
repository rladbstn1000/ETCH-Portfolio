package com.ssafy.etch.demo;

import tools.jackson.databind.ObjectMapper;
import com.ssafy.etch.global.response.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.concurrent.TimeUnit;
import java.util.function.LongSupplier;
import org.springframework.web.filter.OncePerRequestFilter;

/** One bounded in-memory budget for this single backend. No visitor identity or forwarded IP is trusted. */
public final class PublicDemoRequestFilter extends OncePerRequestFilter {
    private final ObjectMapper mapper;
    private final int maximum;
    private final long windowNanos;
    private final LongSupplier clock;
    private long windowStart;
    private int requests;

    public PublicDemoRequestFilter(ObjectMapper mapper, int maximum, int seconds) {
        this(mapper, maximum, seconds, System::nanoTime);
    }

    PublicDemoRequestFilter(ObjectMapper mapper, int maximum, int seconds, LongSupplier clock) {
        if (maximum < 1 || maximum > 10000 || seconds < 1 || seconds > 3600) {
            throw new IllegalArgumentException("Invalid public-demo rate limit configuration");
        }
        this.mapper = mapper;
        this.maximum = maximum;
        this.windowNanos = TimeUnit.SECONDS.toNanos(seconds);
        this.clock = clock;
        this.windowStart = clock.getAsLong();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
        // Deny before quota accounting, including real JWTs, cookies and unknown endpoints.
        if (!PublicDemoRequestPolicy.allows(request)) {
            error(request, response, 403, "공개 데모에서 허용하지 않는 요청입니다.");
            return;
        }
        if (!"/health".equals(PublicDemoRequestPolicy.path(request))) {
            long retryAfter = reserve();
            if (retryAfter > 0) {
                response.setHeader("Retry-After", Long.toString(retryAfter));
                error(request, response, 429, "요청이 많습니다. 잠시 후 다시 시도해 주세요.");
                return;
            }
        }
        try { PublicDemoRequestPolicy.validate(request); }
        catch (IllegalArgumentException exception) {
            error(request, response, 400, "잘못된 입력입니다.");
            return;
        }
        chain.doFilter(request, response);
    }

    private synchronized long reserve() {
        long now = clock.getAsLong();
        if (now - windowStart >= windowNanos) { windowStart = now; requests = 0; }
        if (requests >= maximum) return Math.max(1, (windowNanos - (now - windowStart) + 999999999L) / 1000000000L);
        requests++;
        return 0;
    }

    private void error(HttpServletRequest request, HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        response.setHeader("Cache-Control", "no-store");
        if (!"HEAD".equals(request.getMethod())) mapper.writeValue(response.getWriter(), ApiResponse.error(message));
    }
}
