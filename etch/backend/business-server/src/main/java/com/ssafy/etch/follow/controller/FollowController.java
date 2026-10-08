package com.ssafy.etch.follow.controller;

import com.ssafy.etch.follow.dto.FollowCountResponseDTO;
import com.ssafy.etch.follow.service.FollowService;
import com.ssafy.etch.global.response.ApiResponse;
import com.ssafy.etch.member.dto.MemberResponseDTO;
import com.ssafy.etch.oauth.dto.CustomOAuth2User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/follows")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    @PostMapping("/{targetId}")
    public ResponseEntity<ApiResponse<?>> follow(
            @AuthenticationPrincipal CustomOAuth2User oAuth2User,
            @PathVariable Long targetId) {
        followService.follow(oAuth2User.getId(), targetId);
        return ResponseEntity.ok(ApiResponse.success(null, "팔로우 추가"));
    }

    @DeleteMapping("/{targetId}")
    public ResponseEntity<ApiResponse<?>> unfollow(
            @AuthenticationPrincipal CustomOAuth2User oAuth2User,
            @PathVariable Long targetId) {
        followService.unfollow(oAuth2User.getId(), targetId);
        return ResponseEntity.ok(ApiResponse.success(null, "팔로우 제거"));
    }

    @GetMapping("/followers")
    public ResponseEntity<ApiResponse<List<MemberResponseDTO>>> getFollowerList(@AuthenticationPrincipal CustomOAuth2User oAuth2User) {
        List<MemberResponseDTO> result = followService.getFollowerList(oAuth2User.getId());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/following")
    public ResponseEntity<ApiResponse<List<MemberResponseDTO>>> getFollowingList(@AuthenticationPrincipal CustomOAuth2User oAuth2User) {
        List<MemberResponseDTO> result = followService.getFollowingList(oAuth2User.getId());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{memberId}")
    public ResponseEntity<ApiResponse<FollowCountResponseDTO>> getFollowCount(
            @PathVariable Long memberId) {
        FollowCountResponseDTO result = followService.getFollowCountInfo(memberId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/exists/{memberId}")
    public ResponseEntity<ApiResponse<Boolean>> isFollowed(
            @AuthenticationPrincipal CustomOAuth2User oAuth2User,
            @PathVariable Long memberId ) {
        Boolean result = followService.isFollowed(oAuth2User.getId(), memberId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
