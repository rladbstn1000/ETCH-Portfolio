package com.ssafy.etch.comment.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CommentDeleteResponseDTO {
	private Long deletedId; // 삭제된 댓글 ID
	private Boolean success; // 삭제 성공 여부
}
