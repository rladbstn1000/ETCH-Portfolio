package com.ssafy.etch.news.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Builder
@Getter
public class NewsLikeResponseDTO {
    private Long id;
    private String thumbnailUrl;
    private String title;
    private String description;
    private String url;
    private LocalDateTime publishedAt;
    private String name;

    public static NewsLikeResponseDTO from(NewsDTO newsDTO) {
        return NewsLikeResponseDTO.builder()
                .id(newsDTO.getId())
                .thumbnailUrl(newsDTO.getThumbnailUrl())
                .title(newsDTO.getTitle())
                .description(newsDTO.getDescription())
                .url(newsDTO.getUrl())
                .publishedAt(newsDTO.getPublishedAt())
                .name(newsDTO.getCompany().toCompanyDTO().getName())
                .build();
    }
}
