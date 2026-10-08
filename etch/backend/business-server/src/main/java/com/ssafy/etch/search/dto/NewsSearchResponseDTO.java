package com.ssafy.etch.search.dto;

import java.time.LocalDateTime;

import com.ssafy.etch.search.document.NewsDocument;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class NewsSearchResponseDTO {
	private Long id;
	private String title;
	private String summary;
	private String companyName;
	private String link;
	private String thumbnailUrl;
	private LocalDateTime publishedAt;

	public static NewsSearchResponseDTO from(NewsDocument newsDocument) {
		return NewsSearchResponseDTO.builder()
			.id(newsDocument.getNewsId())
			.title(newsDocument.getTitle())
			.summary(newsDocument.getSummary())
			.companyName(newsDocument.getCompanyName())
			.link(newsDocument.getLink())
			.thumbnailUrl(newsDocument.getThumbnailUrl())
			.publishedAt(newsDocument.getPublishedAt())
			.build();
	}
}
