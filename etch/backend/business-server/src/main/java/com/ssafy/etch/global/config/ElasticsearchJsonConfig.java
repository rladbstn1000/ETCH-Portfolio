package com.ssafy.etch.global.config;

import co.elastic.clients.json.JsonpMapper;
import co.elastic.clients.json.jackson.Jackson3JsonpMapper;
import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.json.JsonMapper;

/** Preserve the existing index document contract independently of HTTP response JSON. */
@Configuration(proxyBeanMethods = false)
public class ElasticsearchJsonConfig {
    @Bean
    JsonpMapper elasticsearchJsonpMapper() {
        return new Jackson3JsonpMapper(JsonMapper.builder()
            // Jackson 2's setSerializationInclusion covered both bean values and Map content.
            // The Java client's Jackson 3 default covers only values, leaking null Map entries.
            .changeDefaultPropertyInclusion(inclusion -> inclusion
                .withValueInclusion(JsonInclude.Include.NON_NULL)
                .withContentInclusion(JsonInclude.Include.NON_NULL))
            .build());
    }
}
