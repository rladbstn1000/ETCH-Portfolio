package com.ssafy.etch.member.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import tools.jackson.databind.ObjectMapper;
import com.ssafy.etch.global.exception.CustomException;
import com.ssafy.etch.global.exception.ErrorCode;
import com.ssafy.etch.global.response.ApiResponse;
import com.ssafy.etch.global.response.PageResponseDTO;
import com.ssafy.etch.global.service.FastApiService;
import com.ssafy.etch.global.util.CookieUtil;
import com.ssafy.etch.job.dto.RecommendJobDTO;
import com.ssafy.etch.job.service.JobService;
import com.ssafy.etch.member.dto.MemberDTO;
import com.ssafy.etch.member.dto.MemberRequestDTO;
import com.ssafy.etch.member.dto.MemberResponseDTO;
import com.ssafy.etch.member.dto.ProfileImageUpdateResponseDTO;
import com.ssafy.etch.member.service.MemberService;
import com.ssafy.etch.news.dto.RecommendNewsDTO;
import com.ssafy.etch.news.service.NewsService;
import com.ssafy.etch.oauth.dto.CustomOAuth2User;
import com.ssafy.etch.oauth.jwt.util.JWTUtil;
import com.ssafy.etch.project.dto.ProjectListDTO;
import com.ssafy.etch.project.service.ProjectService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Tag(
	name = "Members",
	description = "Members Controller 입니다."
)
@RestController
@RequiredArgsConstructor
@RequestMapping("/members")
public class MemberController {

	private final ObjectMapper objectMapper;
	private final MemberService memberService;
	private final JWTUtil jwtUtil;
	private final ProjectService projectService;
	private final NewsService newsService;
	private final FastApiService fastApiService;
	private final JobService jobService;
    private final CookieUtil cookieUtil;

	@Operation(
		summary = "마이페이지 API",
		description = "마이페이지를 조회할 수 있습니다."
	)
	@GetMapping("/me")
	public ResponseEntity<ApiResponse<MemberResponseDTO>> getMyInfo(
		@AuthenticationPrincipal CustomOAuth2User oAuth2User) {
		if (oAuth2User == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Invalid refresh token."));
		}
		MemberResponseDTO memberDTO = MemberResponseDTO.from(memberService.findById(oAuth2User.getId()));

		// 추천 api 호출
		fastApiService.requestRecommendList(oAuth2User.getId()).subscribe();

		return ResponseEntity.ok(ApiResponse.success(memberDTO));
	}

	@Operation(
		summary = "회원가입 API",
		description = "회원가입을 할 수 있습니다."
	)
	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ApiResponse<Object>> registerNewMember(
		@AuthenticationPrincipal CustomOAuth2User oAuth2User,
		@RequestPart("data") String requestJson,
		@RequestPart(value = "profile", required = false) MultipartFile profile,
		HttpServletResponse response) {
		if (oAuth2User == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("인증되지 않은 사용자입니다."));
		}
		MemberRequestDTO requestDTO = safeParseJson(requestJson, MemberRequestDTO.class);

		// 회원 등록
		MemberDTO newMember = memberService.registerNewMember(oAuth2User.getEmail(), requestDTO, profile);

		// 새로운 액세스 토큰 발급
		String newAccessToken = jwtUtil.createJwt(
			"access",
			newMember.getEmail(),
			newMember.getRole(),
			newMember.getId(),
			30 * 60 * 1000L // 30분
		);

		// 새로운 리프레시 토큰을 쿠키로 전달
		Cookie refreshCookie = cookieUtil.createCookie("refresh", newMember.getRefreshToken());
		response.addCookie(refreshCookie);

		// 응답 헤더에 액세스 토큰 추가
		response.setHeader("Authorization", newAccessToken);

		return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(MemberResponseDTO.from(newMember), "회원가입 성공"));
	}

	@Operation(
		summary = "다른 회원 프로필 조회 API",
		description = "다른 회원의 프로필을 조회할 수 있습니다."
	)
	@GetMapping("/{id}")
	public ResponseEntity<?> getMemberInfo(@PathVariable("id") Long id) {
		MemberDTO memberDTO = memberService.findById(id);

		MemberResponseDTO responseDTO = MemberResponseDTO.from(memberDTO);
		return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(responseDTO));
	}

	@Operation(
		summary = "회원 탈퇴 API",
		description = "본인 계정을 탈퇴를 할 수 있습니다."
	)
	@DeleteMapping
	public ResponseEntity<ApiResponse<?>> deleteMember(@AuthenticationPrincipal CustomOAuth2User oAuth2User) {
		memberService.deleteMember(oAuth2User.getId());
		return ResponseEntity.ok(ApiResponse.success(null, "회원 탈퇴가 완료되었습니다."));
	}

	@Operation(
		summary = "회원 정보 수정 API",
		description = "본인 계정에 대한 정보를 수정할 수 있습니다."
	)
	@PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ApiResponse<?>> updateMemberInfo(
		@AuthenticationPrincipal CustomOAuth2User oAuth2User,
		@RequestPart("data") String requestJson,
		@RequestPart(value = "profile", required = false) MultipartFile profile) {

		MemberRequestDTO memberRequestDTO = safeParseJson(requestJson, MemberRequestDTO.class);
		MemberDTO memberDTO = memberService.updateMember(oAuth2User.getId(), memberRequestDTO, profile);
		return ResponseEntity.ok(ApiResponse.success(MemberResponseDTO.from(memberDTO), "회원 정보가 수정되었습니다."));
	}

	@Operation(
		summary = "마이페이지 내 프로젝트 목록 조회",
		description = "내 프로젝트 목록 조회(비공개 프로젝트 포함)"
	)
	@GetMapping("/projects")
	public ResponseEntity<ApiResponse<List<ProjectListDTO>>> getProjectList(
		@AuthenticationPrincipal CustomOAuth2User oAuth2User) {

		List<ProjectListDTO> list = memberService.findAllProjectByMemberId(oAuth2User.getId());

		return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(list));
	}

	@Operation(
		summary = "다른 사람 프로젝트 목록 조회 API",
		description = "다른 사람의 공개된 프로젝트 목록 조회"
	)
	@GetMapping("/{id}/projects")
	public ResponseEntity<ApiResponse<PageResponseDTO<ProjectListDTO>>> getPublicProjectByUser(
		@PathVariable("id") Long id,
		@AuthenticationPrincipal CustomOAuth2User user,
		@RequestParam(defaultValue = "1") int page,
		@RequestParam(defaultValue = "9") int pageSize) {
		if (user == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(ApiResponse.error("로그인이 필요합니다."));
		}

		PageResponseDTO<ProjectListDTO> list = projectService.getPublicProjectByUser(id, page, pageSize);

		return ResponseEntity.ok(ApiResponse.success(list));
	}

	@Operation(
		summary = "추천 기사 목록 조회 API",
		description = "사용자 맞춤 추천 기사 목록 조회"
	)
	@GetMapping("/me/recommend-news")
	public ResponseEntity<ApiResponse<List<RecommendNewsDTO>>> getRecommendNewsList(
		@AuthenticationPrincipal CustomOAuth2User user
	) {
		List<RecommendNewsDTO> list = newsService.getRecommendNewsFromRedis(user.getId());
		return ResponseEntity.ok(ApiResponse.success(list));
	}

	@Operation(
		summary = "추천 채용공고 목록 조회 API",
		description = "사용자 맞춤 추천 채용공고 목록 조회"
	)
	@GetMapping("/me/recommend-job")
	public ResponseEntity<ApiResponse<List<RecommendJobDTO>>> getRecommendJobList(
		@AuthenticationPrincipal CustomOAuth2User user
	) {
		List<RecommendJobDTO> list = jobService.getRecommendJobFromRedis(user.getId());
		return ResponseEntity.ok(ApiResponse.success(list));
	}

	@Operation(
		summary = "프로필 사진 변경 API",
		description = "프로필 사진을 변경할 수 있습니다."
	)
	@PatchMapping(value = "/profile-update", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ApiResponse<ProfileImageUpdateResponseDTO>> updateProfileImage(
		@AuthenticationPrincipal CustomOAuth2User oAuth2User,
		@RequestPart("profile") MultipartFile profile) {
		if (oAuth2User == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("인증되지 않은 사용자입니다."));
		}
		String profileImageUrl = memberService.updateProfileImage(oAuth2User.getId(), profile);
		return ResponseEntity.ok(
			ApiResponse.success(new ProfileImageUpdateResponseDTO(profileImageUrl), "프로필 사진이 변경되었습니다."));
	}

	private <T> T safeParseJson(String json, Class<T> clazz) {
		try {
			return objectMapper.readValue(json, clazz);
		} catch (Exception e) {
			throw new CustomException(ErrorCode.INVALID_INPUT);
		}
	}
}
