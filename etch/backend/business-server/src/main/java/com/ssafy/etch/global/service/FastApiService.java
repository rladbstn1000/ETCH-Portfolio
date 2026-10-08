package com.ssafy.etch.global.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class FastApiService {

    private final org.springframework.beans.factory.ObjectProvider<WebClient> clients;  // 의존성 주입

    public Mono<Void> requestRecommendList(Long memberId) {
        WebClient webClient = clients.getIfAvailable();
        if (webClient == null) return Mono.empty();
        return webClient.get()
                .uri("/recommend/"+memberId)
                .retrieve()
                .bodyToMono(Void.class);
    }
}
