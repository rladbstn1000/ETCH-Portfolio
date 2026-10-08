package com.ssafy.etch.search.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.etch.global.response.ApiResponse;
import com.ssafy.etch.search.dto.JobSearchResponseDTO;
import com.ssafy.etch.search.service.JobSearchService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/jobs/search")
public class JobSearchController {
	private final JobSearchService jobSearchService;

	@GetMapping("")
	public ResponseEntity<ApiResponse<Page<JobSearchResponseDTO>>> searchJobs(
		@RequestParam(required = false) String keyword,
		@RequestParam(required = false) List<String> regions,
		@RequestParam(required = false) List<String> jobCategories,
		@RequestParam(required = false) String workType,
		@RequestParam(required = false) String educationLevel,
		@RequestParam(defaultValue = "0") int page,
		@RequestParam(defaultValue = "10") int size
	) {
		Page<JobSearchResponseDTO> jobSearchResponseDTOPage = jobSearchService.searchWithFilters(keyword, regions,
			jobCategories, workType,
			educationLevel, page, size);

		return ResponseEntity.ok(ApiResponse.success(jobSearchResponseDTOPage));
	}
}
