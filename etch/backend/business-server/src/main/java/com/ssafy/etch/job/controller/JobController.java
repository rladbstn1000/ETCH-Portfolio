package com.ssafy.etch.job.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.etch.global.response.ApiResponse;
import com.ssafy.etch.job.dto.JobResponseDTO;
import com.ssafy.etch.job.service.JobService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/jobs")
public class JobController {
	private final JobService jobService;

	@GetMapping("/{jobId}")
	public ResponseEntity<ApiResponse<JobResponseDTO>> getJob(@PathVariable Long jobId) {
		JobResponseDTO jobResponseDTO = jobService.getJob(jobId);
		return ResponseEntity.ok(ApiResponse.success(jobResponseDTO));
	}

	@GetMapping("/overlap")
	public ResponseEntity<ApiResponse<List<JobResponseDTO>>> getOverlappingJobs(
		@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
		@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {

		List<JobResponseDTO> jobResponseDTOList = jobService.getJobsByDate(start, end);
		return ResponseEntity.ok(ApiResponse.success(jobResponseDTOList));
	}

	@GetMapping("/expiring")
	public ResponseEntity<ApiResponse<List<JobResponseDTO>>> getExpiringJobs(
		@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
		@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end
	) {
		return ResponseEntity.ok(ApiResponse.success(
			jobService.getJobsByExpirationDate(start, end)
		));
	}
}
