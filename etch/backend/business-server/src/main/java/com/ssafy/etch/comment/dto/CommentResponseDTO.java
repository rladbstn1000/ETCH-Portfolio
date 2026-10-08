package com.ssafy.etch.comment.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class CommentResponseDTO {
	private Long id;
	private Long memberId;
	private String nickname;
	private String content;
	private LocalDateTime createdAt;
	private Boolean isDeleted;
	private String profile;

	public static CommentResponseDTO from(CommentDTO commentDTO) {
		return CommentResponseDTO.builder()
			.id(commentDTO.getId())
			.memberId(commentDTO.getMember().getId())
			.nickname(commentDTO.getMember().toMemberDTO().getNickname())
			.content(commentDTO.getContent())
			.createdAt(commentDTO.getCreatedAt())
			.isDeleted(commentDTO.getIsDeleted())
			.profile(commentDTO.getMember().toMemberDTO().getProfile())
			.build();

	}
}
