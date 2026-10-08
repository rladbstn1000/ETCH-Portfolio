package com.ssafy.etch.comment.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CommentListResponseDTO {
	private Long count;
	private List<CommentResponseDTO> comments;
}
