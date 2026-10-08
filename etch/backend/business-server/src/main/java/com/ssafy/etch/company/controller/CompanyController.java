package com.ssafy.etch.company.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.etch.company.dto.CompanyInfoDTO;
import com.ssafy.etch.company.service.CompanyService;
import com.ssafy.etch.global.response.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * 기업 관련 API
 */
@Tag(
	name = "Company",
	description = "Company Controller 입니다."
)
@RestController
@RequestMapping("/companies")
public class CompanyController {

	private final CompanyService companyService;

	public CompanyController(CompanyService companyService) {
		this.companyService = companyService;
	}

	@Operation(
		summary = "특정 기업 조회 API",
		description = "특정 기업에 대한 정보를 확인할 수 있습니다."
	)
	@GetMapping("/{companyId}")
	public ResponseEntity<ApiResponse<CompanyInfoDTO>> getCompanyInfo(@PathVariable Long companyId) {
		CompanyInfoDTO companyInfo = companyService.getCompanyInfo(companyId);

		return ResponseEntity.ok(ApiResponse.success(companyInfo));
	}

}
