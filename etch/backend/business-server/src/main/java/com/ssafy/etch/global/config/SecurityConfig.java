package com.ssafy.etch.global.config;

import tools.jackson.databind.ObjectMapper;
import com.ssafy.etch.global.exception.ErrorCode;
import com.ssafy.etch.global.response.ApiResponse;
import com.ssafy.etch.oauth.handler.CustomOAuth2FailureHandler;
import com.ssafy.etch.oauth.handler.CustomSuccessHandler;
import com.ssafy.etch.oauth.jwt.filter.JWTFilter;
import com.ssafy.etch.oauth.jwt.filter.JwtExceptionFilter;
import com.ssafy.etch.oauth.jwt.util.JWTUtil;
import com.ssafy.etch.oauth.service.CustomOAuth2UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

@Configuration
@org.springframework.context.annotation.Profile("!public-demo")
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final CustomOAuth2UserService customOAuth2UserService;
    private final CustomSuccessHandler customSuccessHandler;
    private final CustomOAuth2FailureHandler customOAuth2FailureHandler;
    private final JWTUtil jwtUtil;
    private final JwtExceptionFilter jwtExceptionFilter;
    private final ObjectMapper objectMapper;

    @Value("${app.features.oauth-enabled:true}")
    private boolean oauthEnabled;

    @Value("${app.auth.allowed-origins:http://localhost:5173}")
    private List<String> allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> cors.configurationSource(request -> {
            CorsConfiguration configuration = new CorsConfiguration();
            configuration.setAllowedOrigins(allowedOrigins);
            configuration.setAllowCredentials(true);
            configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
            configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With"));
            configuration.setExposedHeaders(List.of("Authorization"));
            configuration.setMaxAge(3600L);
            return configuration;
        }));
        // API authentication uses an explicit Bearer header. Refresh cookies are HttpOnly/SameSite=Lax.
        http.csrf(auth -> auth.disable());
        http.formLogin(auth -> auth.disable());
        http.httpBasic(auth -> auth.disable());
        http.addFilterBefore(new JWTFilter(jwtUtil), UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(jwtExceptionFilter, JWTFilter.class);

        if (oauthEnabled) {
            http.oauth2Login(auth -> auth.userInfoEndpoint(info -> info.userService(customOAuth2UserService))
                .successHandler(customSuccessHandler).failureHandler(customOAuth2FailureHandler));
        }

        http.exceptionHandling(exceptions -> exceptions
            .authenticationEntryPoint((request, response, exception) -> {
                response.setStatus(401);
                response.setContentType("application/json;charset=UTF-8");
                objectMapper.writeValue(response.getWriter(), ApiResponse.error(ErrorCode.UNAUTHENTICATED_USER.getMessage()));
            })
            .accessDeniedHandler((request, response, exception) -> {
                response.setStatus(403);
                response.setContentType("application/json;charset=UTF-8");
                objectMapper.writeValue(response.getWriter(), ApiResponse.error(ErrorCode.ACCESS_DENIED.getMessage()));
            }));

        http.authorizeHttpRequests(auth -> auth
            .requestMatchers("/error", "/oauth2/**", "/login/oauth2/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
            .requestMatchers(HttpMethod.POST, "/auth/reissue").permitAll()
            .requestMatchers(HttpMethod.GET, "/actuator/health", "/search", "/jobs/**", "/news/**", "/companies/**",
                "/projects", "/projects/search", "/projects/{id:[0-9]+}", "/projects/{id:[0-9]+}/comments").permitAll()
            // CustomOAuth2User produces literal GUEST/USER authorities; no implicit ROLE_ prefix.
            .requestMatchers(HttpMethod.POST, "/members", "/members/").hasAuthority("GUEST")
            .anyRequest().hasAuthority("USER"));
        http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        return http.build();
    }
}
