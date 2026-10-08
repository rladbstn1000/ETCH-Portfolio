package com.ssafy.etch.search.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.etch.global.response.ApiResponse;
import com.ssafy.etch.search.dto.JobSearchResponseDTO;
import com.ssafy.etch.search.dto.NewsSearchResponseDTO;
import com.ssafy.etch.search.dto.ProjectSearchPage;
import com.ssafy.etch.search.dto.SearchResponseDTO;
import com.ssafy.etch.search.enumeration.ProjectSort;
import com.ssafy.etch.search.service.JobSearchService;
import com.ssafy.etch.search.service.NewsSearchService;
import com.ssafy.etch.search.service.ProjectSearchService;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@Tag(name = "SearchController", description = "통합검색 API")
@RestController
@RequestMapping("/search")
@RequiredArgsConstructor
public class SearchController {
	private final JobSearchService jobSearchService;
	private final NewsSearchService newsSearchService;
	private final ProjectSearchService projectSearchService;

	@GetMapping
	public ResponseEntity<ApiResponse<SearchResponseDTO>> search(@RequestParam(required = false) String keyword,
		@RequestParam(defaultValue = "0") int page,
		@RequestParam(defaultValue = "3") int size) {
		Page<JobSearchResponseDTO> jobDocuments = jobSearchService.searchWithFilters(keyword, null, null, null,
			null, page, size);
		Page<NewsSearchResponseDTO> newsDocuments = newsSearchService.search(keyword, page, size);
		ProjectSearchPage projectDocuments = projectSearchService.search(keyword, null,
			ProjectSort.LATEST, page, size);
		SearchResponseDTO searchResponseDTO = SearchResponseDTO.from(jobDocuments, newsDocuments, projectDocuments);
		return ResponseEntity.ok(ApiResponse.success(searchResponseDTO));
	}
}
