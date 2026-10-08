package com.ssafy.etch.search.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.etch.global.response.ApiResponse;
import com.ssafy.etch.search.dto.NewsSearchResponseDTO;
import com.ssafy.etch.search.service.NewsSearchService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/news/search")
public class NewsSearchController {
	private final NewsSearchService newsSearchService;

	@GetMapping("")
	public ResponseEntity<ApiResponse<Page<NewsSearchResponseDTO>>> searchNews(
		@RequestParam(required = false) String keyword,
		@RequestParam(defaultValue = "0") int page,
		@RequestParam(defaultValue = "10") int size) {
		Page<NewsSearchResponseDTO> result = newsSearchService.search(keyword, page, size);
		return ResponseEntity.ok(ApiResponse.success(result));
	}
}
