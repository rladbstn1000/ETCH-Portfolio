package com.ssafy.etch.search.dto;

import java.util.Optional;

import com.ssafy.etch.search.document.ProjectDocument;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class ProjectSearchResponseDTO {
	private Long projectId;
	private String title;
	private String memberName;
	private String thumbnailUrl;
	private Integer likeCount;
	private Long viewCount;

	public static ProjectSearchResponseDTO from(ProjectDocument projectDocument) {
		return ProjectSearchResponseDTO.builder()
			.projectId(projectDocument.getProjectId())
			.title(projectDocument.getTitle())
			.memberName(projectDocument.getMemberName())
			.thumbnailUrl(projectDocument.getThumbnailUrl())
			.likeCount(Optional.ofNullable(projectDocument.getLikeCount()).orElse(0))
			.viewCount(projectDocument.getViewCount())
			.build();
	}
}
