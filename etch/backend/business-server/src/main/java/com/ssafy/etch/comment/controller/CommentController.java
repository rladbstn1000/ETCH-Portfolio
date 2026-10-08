package com.ssafy.etch.comment.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.etch.comment.dto.CommentDeleteResponseDTO;
import com.ssafy.etch.comment.dto.CommentListResponseDTO;
import com.ssafy.etch.comment.dto.CommentRequestDTO;
import com.ssafy.etch.comment.dto.CommentResponseDTO;
import com.ssafy.etch.comment.service.CommentService;
import com.ssafy.etch.global.response.ApiResponse;
import com.ssafy.etch.oauth.dto.CustomOAuth2User;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

/**
 * 댓글 관련 API
 */
@Tag(
	name = "Comment",
	description = "Comment controller 입니다."
)
@RestController
@RequestMapping("/projects/{projectId}/comments")
public class CommentController {

	private final CommentService commentService;

	public CommentController(CommentService commentService) {
		this.commentService = commentService;
	}

	@Operation(
		summary = "특정 게시글에 대한 전체 댓글 조회 API",
		description = "특정 게시글에 대한 댓글 전체 개수와 목록이 보여집니다."
	)
	@GetMapping
	public ResponseEntity<ApiResponse<CommentListResponseDTO>> getAllCommentsByProjectId(@PathVariable Long projectId, @AuthenticationPrincipal CustomOAuth2User user) {
		CommentListResponseDTO result = commentService.getCommentsWithCountByProjectId(projectId, user == null ? null : user.getId());

		return ResponseEntity.ok(ApiResponse.success(result));
	}

	@Operation(
		summary = "댓글 등록 API",
		description = "USER만 댓글을 등록할 수 있습니다."
	)
	@PostMapping
	public ResponseEntity<ApiResponse<CommentResponseDTO>> registComment (
		@PathVariable Long projectId,
		@RequestBody @Valid CommentRequestDTO commentRequestDTO,
		@AuthenticationPrincipal CustomOAuth2User user) {

		CommentResponseDTO response = commentService.registComment(projectId, commentRequestDTO, user.getId());

		return ResponseEntity.ok(ApiResponse.success(response));
	}

	@Operation(
		summary = "댓글 삭제 API",
		description = "USER 본인 댓글만 삭제할 수 있습니다."
	)
	@DeleteMapping("/{commentId}")
	public ResponseEntity<ApiResponse<CommentDeleteResponseDTO>> deleteComment (
		@PathVariable Long projectId,
		@PathVariable Long commentId,
		@AuthenticationPrincipal CustomOAuth2User user) {

		CommentDeleteResponseDTO response = commentService.deleteComment(projectId, commentId, user.getId());

		return ResponseEntity.ok(ApiResponse.success(response));
	}
}
