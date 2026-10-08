package com.ssafy.etch.demo;

import tools.jackson.databind.ObjectMapper;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import static org.assertj.core.api.Assertions.assertThat;

class PublicDemoRateLimitTest {
    @Test void globalBudgetRejectsSpoofedForwardedIpsAndRecoversAfterWindow() throws Exception {
        AtomicLong clock = new AtomicLong();
        PublicDemoRequestFilter filter = new PublicDemoRequestFilter(new ObjectMapper(), 2, 60, clock::get);
        AtomicInteger reached = new AtomicInteger();
        for (int i = 0; i < 4; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/news/search");
            request.setRemoteAddr("192.0.2." + i);
            request.addHeader("X-Forwarded-For", "198.51.100." + i);
            request.addHeader("Forwarded", "for=203.0.113." + i);
            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilter(request, response, (req, res) -> reached.incrementAndGet());
            assertThat(response.getStatus()).isEqualTo(i < 2 ? 200 : 429);
            if (i >= 2) assertThat(response.getHeader("Retry-After")).isEqualTo("60");
        }
        assertThat(reached.get()).isEqualTo(2);
        MockHttpServletResponse health = new MockHttpServletResponse();
        filter.doFilter(new MockHttpServletRequest("GET", "/health"), health, (req, res) -> reached.incrementAndGet());
        assertThat(health.getStatus()).isEqualTo(200);
        clock.set(60_000_000_000L);
        MockHttpServletResponse recovered = new MockHttpServletResponse();
        filter.doFilter(new MockHttpServletRequest("GET", "/news/search"), recovered, (req, res) -> reached.incrementAndGet());
        assertThat(recovered.getStatus()).isEqualTo(200);
        assertThat(reached.get()).isEqualTo(4);
    }

    @Test void deniedRoutesCannotUseOrExhaustTheReadQuotaAndHeadHasNoErrorBody() throws Exception {
        PublicDemoRequestFilter filter = new PublicDemoRequestFilter(new ObjectMapper(), 1, 60, () -> 0);
        for (int i = 0; i < 3; i++) {
            MockHttpServletResponse denied = new MockHttpServletResponse();
            filter.doFilter(new MockHttpServletRequest("POST", "/projects"), denied, (req, res) -> { throw new AssertionError(); });
            assertThat(denied.getStatus()).isEqualTo(403);
        }
        filter.doFilter(new MockHttpServletRequest("GET", "/news/search"), new MockHttpServletResponse(), (req, res) -> {});
        MockHttpServletResponse head = new MockHttpServletResponse();
        filter.doFilter(new MockHttpServletRequest("HEAD", "/news/search"), head, (req, res) -> { throw new AssertionError(); });
        assertThat(head.getStatus()).isEqualTo(429);
        assertThat(head.getContentAsString()).isEmpty();
    }
}
