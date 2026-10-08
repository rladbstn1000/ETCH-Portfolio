package com.ssafy.etch.like.controller;

import com.ssafy.etch.company.dto.CompanyLikeResponseDTO;
import com.ssafy.etch.global.response.ApiResponse;
import com.ssafy.etch.job.dto.JobLikeResponseDTO;
import com.ssafy.etch.like.dto.LikeRequestDTO;
import com.ssafy.etch.like.entity.LikeType;
import com.ssafy.etch.like.service.LikeService;
import com.ssafy.etch.news.dto.NewsLikeResponseDTO;
import com.ssafy.etch.oauth.dto.CustomOAuth2User;
import com.ssafy.etch.project.dto.ProjectLikeResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/likes")
public class LikeController {

    private final LikeService likeService;

    @GetMapping("/news")
    public ResponseEntity<ApiResponse<List<NewsLikeResponseDTO>>> getLikeNews(@AuthenticationPrincipal CustomOAuth2User oAuth2User){

        List<NewsLikeResponseDTO> list = likeService.getLikedNews(oAuth2User.getId());

        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(list));
    }
    @PostMapping("/news")
    public ResponseEntity<ApiResponse<Object>> createLikeNews(@AuthenticationPrincipal CustomOAuth2User oAuth2User,
                                                              @RequestBody LikeRequestDTO likeRequestDTO) {
        if (oAuth2User == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("인증되지 않은 사용자입니다."));
        }

        likeService.saveLike(oAuth2User.getId(), likeRequestDTO, LikeType.NEWS);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(null, "뉴스 좋아요가 등록되었습니다."));
    }
    @DeleteMapping("/news/{id}")
    public ResponseEntity<ApiResponse<?>> deleteLikeNews(@AuthenticationPrincipal CustomOAuth2User oAuth2User,
                                                         @PathVariable Long id) {
        if (oAuth2User == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("인증되지 않은 사용자입니다."));
        }
        likeService.deleteLike(oAuth2User.getId(), id, LikeType.NEWS);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success(null, "뉴스 좋아요가 삭제되었습니다."));
    }

    @GetMapping("/companies")
    public ResponseEntity<ApiResponse<List<CompanyLikeResponseDTO>>> getLikeCompany(@AuthenticationPrincipal CustomOAuth2User oAuth2User){

        List<CompanyLikeResponseDTO> list = likeService.getLikedCompany(oAuth2User.getId());

        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(list));
    }
    @PostMapping("/companies")
    public ResponseEntity<ApiResponse<Object>> createLikeCompany(@AuthenticationPrincipal CustomOAuth2User oAuth2User,
                                                              @RequestBody LikeRequestDTO likeRequestDTO) {
        if (oAuth2User == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("인증되지 않은 사용자입니다."));
        }

        likeService.saveLike(oAuth2User.getId(), likeRequestDTO, LikeType.COMPANY);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(null, "기업 좋아요가 등록되었습니다."));
    }
    @DeleteMapping("/companies/{id}")
    public ResponseEntity<ApiResponse<?>> deleteLikeCompany(@AuthenticationPrincipal CustomOAuth2User oAuth2User,
                                                         @PathVariable Long id) {
        if (oAuth2User == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("인증되지 않은 사용자입니다."));
        }
        likeService.deleteLike(oAuth2User.getId(), id, LikeType.COMPANY);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success(null, "기업 좋아요가 삭제되었습니다."));
    }

    @GetMapping("/jobs")
    public ResponseEntity<ApiResponse<List<JobLikeResponseDTO>>> getLikeJob(@AuthenticationPrincipal CustomOAuth2User oAuth2User){

        List<JobLikeResponseDTO> list = likeService.getLikedJob(oAuth2User.getId());

        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(list));
    }
    @PostMapping("/jobs")
    public ResponseEntity<ApiResponse<Object>> createLikeJob(@AuthenticationPrincipal CustomOAuth2User oAuth2User,
                                                                 @RequestBody LikeRequestDTO likeRequestDTO) {
        if (oAuth2User == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("인증되지 않은 사용자입니다."));
        }

        likeService.saveLike(oAuth2User.getId(), likeRequestDTO, LikeType.JOB);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(null, "공고 좋아요가 등록되었습니다."));
    }
    @DeleteMapping("/jobs/{id}")
    public ResponseEntity<ApiResponse<?>> deleteLikeJob(@AuthenticationPrincipal CustomOAuth2User oAuth2User,
                                                            @PathVariable Long id) {
        if (oAuth2User == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("인증되지 않은 사용자입니다."));
        }
        likeService.deleteLike(oAuth2User.getId(), id, LikeType.JOB);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success(null, "공고 좋아요가 삭제되었습니다."));
    }

    @GetMapping("/projects")
    public ResponseEntity<ApiResponse<List<ProjectLikeResponseDTO>>> getLikeProject(@AuthenticationPrincipal CustomOAuth2User oAuth2User){

        List<ProjectLikeResponseDTO> list = likeService.getLikedProject(oAuth2User.getId());

        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(list));
    }
    @PostMapping("/projects")
    public ResponseEntity<ApiResponse<Object>> createLikeProject(@AuthenticationPrincipal CustomOAuth2User oAuth2User,
                                                             @RequestBody LikeRequestDTO likeRequestDTO) {
        if (oAuth2User == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("인증되지 않은 사용자입니다."));
        }

        likeService.saveLike(oAuth2User.getId(), likeRequestDTO, LikeType.PROJECT);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(null, "프로젝트 좋아요가 등록되었습니다."));
    }
    @DeleteMapping("/projects/{id}")
    public ResponseEntity<ApiResponse<?>> deleteLikeProject(@AuthenticationPrincipal CustomOAuth2User oAuth2User,
                                                        @PathVariable Long id) {
        if (oAuth2User == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("인증되지 않은 사용자입니다."));
        }
        likeService.deleteLike(oAuth2User.getId(), id, LikeType.PROJECT);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success(null, "프로젝트 좋아요가 삭제되었습니다."));
    }
}
