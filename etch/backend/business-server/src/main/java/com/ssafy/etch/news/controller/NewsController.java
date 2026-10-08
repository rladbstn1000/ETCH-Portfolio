package com.ssafy.etch.news.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.etch.global.response.ApiResponse;
import com.ssafy.etch.global.response.PageResponseDTO;
import com.ssafy.etch.news.dto.CompanyNewsDTO;
import com.ssafy.etch.news.dto.LatestNewsDTO;
import com.ssafy.etch.news.dto.TopCompanyDTO;
import com.ssafy.etch.news.service.NewsServiceImpl;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(
	name = "News",
	description = "News Controller 입니다."
)
@RestController
@RequestMapping("/news")
public class NewsController {

	private final NewsServiceImpl newsService;

	public NewsController(NewsServiceImpl newsService) {
		this.newsService = newsService;
	}

	@Operation(
		summary = "특정 기업에 대한 기사 목록 조회 API",
		description = "특정 기업에 대한 기사 목록을 확인할 수 있습니다."
	)
	@GetMapping("/companies/{companyId}")
	public ResponseEntity<ApiResponse<PageResponseDTO<CompanyNewsDTO>>> getNewsListByCompany(
		@PathVariable Long companyId,
		@RequestParam(defaultValue = "1") int page,
		@RequestParam(defaultValue = "10") int pageSize) {
		return ResponseEntity.ok(ApiResponse.success(newsService.getNewsByCompanyId(companyId, page, pageSize)));
	}

	@Operation(
		summary = "최신 뉴스 조회 API",
		description = "기업에 관계없이 최신순으로 정렬한 뉴스 목록을 제공합니다."
	)
	@GetMapping("/latest") 
	public ResponseEntity<ApiResponse<PageResponseDTO<LatestNewsDTO>>> getLatestNews(
		@RequestParam(defaultValue = "1") int page,
		@RequestParam(defaultValue = "10") int pageSize) {
		return ResponseEntity.ok(ApiResponse.success(newsService.getLatestNews(page, pageSize)));
	}

	@Operation(
		summary = "인기 TOP10 기업 조회 API",
		description = "좋아요 기준으로 정렬된 인기 TOP10 기업 목록을 제공합니다."
	)
	@GetMapping("/top-companies")
	public ResponseEntity<ApiResponse<List<TopCompanyDTO>>> getTopCompanies() {
		List<TopCompanyDTO> list = newsService.getTopCompaniesFromRedis();

		return ResponseEntity.ok(ApiResponse.success(list));
	}
}
