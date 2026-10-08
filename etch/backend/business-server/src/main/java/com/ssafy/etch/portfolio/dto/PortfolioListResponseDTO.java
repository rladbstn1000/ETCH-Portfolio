package com.ssafy.etch.portfolio.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Builder
@Getter
public class PortfolioListResponseDTO {
    private Long id;
    private String name;
    private String introduce;
    private LocalDate updatedAt;

    public static PortfolioListResponseDTO from(PortfolioDTO portfolioDTO) {
        return PortfolioListResponseDTO.builder()
                .id(portfolioDTO.getId())
                .name(portfolioDTO.getName())
                .introduce(portfolioDTO.getIntroduce())
                .updatedAt(portfolioDTO.getUpdatedAt())
                .build();
    }
}
