package com.ssafy.etch.job.controller;

import com.ssafy.etch.global.response.ApiResponse;
import com.ssafy.etch.job.dto.AppliedJobUpdateRequestDTO;
import com.ssafy.etch.job.dto.AppliedJobListResponseDTO;
import com.ssafy.etch.job.entity.ApplyStatusType;
import com.ssafy.etch.job.service.AppliedJobService;
import com.ssafy.etch.oauth.dto.CustomOAuth2User;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(
        name = "AppliedJobs",
        description = "AppliedJobs Controller 입니다. "
)
@RestController
@RequiredArgsConstructor
@RequestMapping("/appliedJobs")
public class AppliedJobController {

    private final AppliedJobService appliedJobService;

    @PostMapping("/{jobId}")
    public ResponseEntity<ApiResponse<?>> createAppliedJob(
            @AuthenticationPrincipal CustomOAuth2User oAuth2User,
            @PathVariable Long jobId) {

        appliedJobService.createAppliedJob(oAuth2User.getId(), jobId);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(null, "지원 공고에 추가되었습니다."));
    }

    @GetMapping("/list")
    public ResponseEntity<ApiResponse<?>> getAppliedJobList(
            @AuthenticationPrincipal CustomOAuth2User oAuth2User) {

        List<AppliedJobListResponseDTO> list = appliedJobService.getAppliedJobList(oAuth2User.getId());

        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(list, "지원공고 목록 조회 완료"));
    }

    @PutMapping("/{appliedJobId}")
    public ResponseEntity<ApiResponse<?>> updateAppliedJob(
            @AuthenticationPrincipal CustomOAuth2User oAuth2User,
            @PathVariable("appliedJobId") Long appliedJobId,
            @RequestBody AppliedJobUpdateRequestDTO requestDTO) {

        appliedJobService.updateAppliedJobStatus(oAuth2User.getId(), appliedJobId, requestDTO.getStatus());

        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(null, "지원 공고 상태 변경 완료"));
    }

    @DeleteMapping("/{appliedJobId}")
    public ResponseEntity<ApiResponse<?>> deleteAppliedJob(
            @AuthenticationPrincipal CustomOAuth2User oAuth2User,
            @PathVariable("appliedJobId") Long appliedJobId) {

        appliedJobService.deleteAppliedJob(oAuth2User.getId(), appliedJobId);

        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(null, "지원 공고가 삭제되었습니다."));
    }

    @GetMapping("/codeList")
    public ResponseEntity<ApiResponse<Map<ApplyStatusType, String>>> getCodeList() {
        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(ApplyStatusType.getStatusDescriptionMap()));
    }

}
