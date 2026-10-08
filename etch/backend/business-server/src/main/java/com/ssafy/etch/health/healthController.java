package com.ssafy.etch.health;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@org.springframework.context.annotation.Profile("!public-demo")
@RestController
public class healthController {

    @GetMapping("/health")
    public String health() {
        return "spring server is health!";
    }
}

