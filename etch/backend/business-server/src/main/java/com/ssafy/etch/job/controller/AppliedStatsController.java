package com.ssafy.etch.job.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.etch.global.response.ApiResponse;
import com.ssafy.etch.job.dto.AppliedRatesResponseDTO;
import com.ssafy.etch.job.dto.CategoryShareDTO;
import com.ssafy.etch.job.dto.MonthlyItemDTO;
import com.ssafy.etch.job.service.AppliedStatsService;
import com.ssafy.etch.oauth.dto.CustomOAuth2User;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@Tag(name = "AppliedStatsController", description = "사용자 지원공고 통계 API")
@RestController
@RequestMapping("/stats")
@RequiredArgsConstructor
public class AppliedStatsController {
	private final AppliedStatsService appliedStatsService;

	@Operation(summary = "사용자 지원 상태 비율",
		description = "사용자가 지원한 채용공고 상태별 비율")
	@GetMapping("/rates")
	public ResponseEntity<ApiResponse<AppliedRatesResponseDTO>> getAppliedRates(
		@AuthenticationPrincipal CustomOAuth2User oAuth2User) {
		AppliedRatesResponseDTO rates = appliedStatsService.getRates(oAuth2User.getId());
		return ResponseEntity.ok(ApiResponse.success(rates));
	}

	@Operation(summary = "설정 기간의 사용자 지원 상태 비율",
		description = "사용자가 지원한 채용공고 설정기간 상태별 비율")
	@GetMapping("/rates/period")
	public ResponseEntity<ApiResponse<AppliedRatesResponseDTO>> getAppliedRatesWithDate(
		@AuthenticationPrincipal CustomOAuth2User oAuth2User,
		@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
		@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

		AppliedRatesResponseDTO rates = appliedStatsService.getRatesWithDate(oAuth2User.getId(), from, to);
		return ResponseEntity.ok(ApiResponse.success(rates));
	}

	@Operation(summary = "월 지원공고 통계", description = "입력한 달의 사용자 지원공고 개수")
	@GetMapping("/monthly")
	ResponseEntity<ApiResponse<List<MonthlyItemDTO>>> getMonthly(@AuthenticationPrincipal CustomOAuth2User oAuth2User,
		@RequestParam int year,
		@RequestParam int month,
		@RequestParam(defaultValue = "true") boolean excludeScheduled) {

		List<MonthlyItemDTO> monthlyItemDTOList = appliedStatsService.getMonthlyCounts(oAuth2User.getId(), year, month,
			excludeScheduled);
		return ResponseEntity.ok(ApiResponse.success(monthlyItemDTOList));
	}

	@Operation(summary = "사용자 지원공고 직무 통계", description = "사용자 지원공고 직무별 퍼센트")
	@GetMapping("/categories")
	public List<CategoryShareDTO> categories(
		@AuthenticationPrincipal CustomOAuth2User oAuth2User,
		@RequestParam(defaultValue = "true") boolean excludeScheduled
	) {
		return appliedStatsService.getCategoryShare(oAuth2User.getId(), excludeScheduled);
	}
}
