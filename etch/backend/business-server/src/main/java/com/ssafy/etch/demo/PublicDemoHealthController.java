package com.ssafy.etch.demo;

import java.util.Map;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile("public-demo")
public class PublicDemoHealthController {
    /** Liveness only; does not promise MySQL/ES readiness and exposes no dependency details. */
    @GetMapping("/health")
    public Map<String, String> health() { return Map.of("status", "UP"); }
}
