package com.ssafy.etch.demo;

import tools.jackson.databind.ObjectMapper;
import com.ssafy.etch.global.response.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;

@Configuration
@EnableWebSecurity
@Profile("public-demo")
public class PublicDemoSecurityConfig {
    @Bean
    SecurityFilterChain publicDemoFilterChain(HttpSecurity http, ObjectMapper mapper,
        @Value("${app.demo.rate-limit.max-requests:600}") int maximum,
        @Value("${app.demo.rate-limit.window-seconds:60}") int seconds) throws Exception {
        http.csrf(config -> config.disable()).cors(config -> config.disable())
            .formLogin(config -> config.disable()).httpBasic(config -> config.disable())
            .logout(config -> config.disable()).requestCache(config -> config.disable())
            .sessionManagement(config -> config.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        // Deliberately no JWT/OAuth/refresh filter: credentials cannot grant extra demo capabilities.
        http.addFilterBefore(new PublicDemoRequestFilter(mapper, maximum, seconds), AuthorizationFilter.class);
        http.authorizeHttpRequests(config -> config
            .requestMatchers(PublicDemoRequestPolicy::allows).permitAll().anyRequest().denyAll());
        http.exceptionHandling(config -> config
            .authenticationEntryPoint((request, response, exception) -> {
                response.setStatus(403);
                response.setContentType("application/json;charset=UTF-8");
                mapper.writeValue(response.getWriter(), ApiResponse.error("공개 데모에서 허용하지 않는 요청입니다."));
            })
            .accessDeniedHandler((request, response, exception) -> {
                response.setStatus(403);
                response.setContentType("application/json;charset=UTF-8");
                mapper.writeValue(response.getWriter(), ApiResponse.error("공개 데모에서 허용하지 않는 요청입니다."));
            }));
        http.headers(headers -> headers
            .contentTypeOptions(options -> {})
            .frameOptions(options -> options.deny())
            .referrerPolicy(options -> options.policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER)));
        return http.build();
    }
}
