package com.ssafy.etch.news.dto;

import com.ssafy.etch.company.entity.CompanyEntity;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Builder
@Getter
public class NewsDTO {
    private Long id;
    private String thumbnailUrl;
    private String title;
    private String description;
    private String url;
    private LocalDateTime publishedAt;
    private CompanyEntity company;
}
