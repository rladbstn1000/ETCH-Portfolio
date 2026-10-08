package com.ssafy.etch.project.dto;

import com.ssafy.etch.project.entity.ProjectCategory;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class ProjectListDTO {
	private Long id;
	private String title;
	private String thumbnailUrl;
	private ProjectCategory projectCategory;
	private Long viewCount;
	private Long likeCount;
	private String nickname;
	private Boolean isPublic;
	private Double popularityScore;

	public static ProjectListDTO from(ProjectDTO p) {
		return ProjectListDTO.builder()
			.id(p.getId())
			.title(p.getTitle())
			.projectCategory(p.getProjectCategory())
			.thumbnailUrl(p.getThumbnailUrl())
			.viewCount(p.getViewCount())
			.likeCount(p.getLikeCount() != null ? p.getLikeCount().longValue() : 0L)
			.nickname(p.getMember().toMemberDTO().getNickname())
			.isPublic(p.getIsPublic())
			.popularityScore(p.getPopularityScore())
			.build();
	}
}
