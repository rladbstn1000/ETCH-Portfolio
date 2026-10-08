package com.ssafy.etch.search.dto;

import org.springframework.data.domain.Page;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class SearchResponseDTO {

	private Page<JobSearchResponseDTO> jobs;
	private Page<NewsSearchResponseDTO> news;
	private ProjectSearchPage projects;

	public static SearchResponseDTO from(Page<JobSearchResponseDTO> jobs, Page<NewsSearchResponseDTO> news,
		ProjectSearchPage projects) {
		return SearchResponseDTO.builder()
			.jobs(jobs)
			.news(news)
			.projects(projects)
			.build();
	}
}
