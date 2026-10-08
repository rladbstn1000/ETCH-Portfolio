package com.ssafy.etch.news.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class CompanyNewsDTO {
	private Long id;
	private String thumbnailUrl;
	private String title;
	private String description;
	private String url;
	private LocalDateTime publishedAt;

	public static CompanyNewsDTO from(NewsDTO newsDTO) {
		return CompanyNewsDTO.builder()
			.id(newsDTO.getId())
			.thumbnailUrl(newsDTO.getThumbnailUrl())
			.title(newsDTO.getTitle())
			.description(newsDTO.getDescription())
			.url(newsDTO.getUrl())
			.publishedAt(newsDTO.getPublishedAt())
			.build();
	}
}
