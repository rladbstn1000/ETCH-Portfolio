package com.ssafy.etch.global.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name = "app.features.recommendations-enabled", havingValue = "true", matchIfMissing = true)
@Configuration
public class FastApiConfig {

    @Bean
    @Qualifier("fastApiClient")
    public WebClient fastApiWebClient(@org.springframework.beans.factory.annotation.Value("${app.recommendations.base-url}") String baseUrl) {
        return WebClient.builder()
.baseUrl(baseUrl)
                .defaultHeader("Content-Type", "application/json")
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                .build();
    }
}