package com.ssafy.etch.project.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class ProjectDetailDTO {
	private Long id;
	private Long memberId;
	private String title;
	private String content;
	private String thumbnailUrl;
	private String youtubeUrl;
	private Long viewCount;
	private Long likeCount; 
	private Boolean likedByMe; // 내가 좋아요 눌렀는지 여부
	private String nickname;
	private String profileUrl;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;

	private String projectCategory; // 프로젝트 카테고리
	private List<String> techCategories; // 기술 카테고리(BACKEND/FRONTEND)

	private List<String> techCodes;
	private List<String> fileUrls;
	private String githubUrl;
	private Boolean isPublic;

	public static ProjectDetailDTO from(
		ProjectDTO p,
		Boolean likedByMe,
		List<String> techCategories,
		List<String> techCodes,
		List<String> fileUrls
	) {
		return ProjectDetailDTO.builder()
			.id(p.getId())
			.memberId(p.getMember().toMemberDTO().getId())
			.thumbnailUrl(p.getThumbnailUrl())
			.youtubeUrl(p.getYoutubeUrl())
			.viewCount(p.getViewCount())
			.likeCount(p.getLikeCount() != null ? p.getLikeCount().longValue() : 0L)
			.likedByMe(likedByMe)
			.nickname(p.getMember().toMemberDTO().getNickname())
			.profileUrl(p.getMember().toMemberDTO().getProfile())
			.title(p.getTitle())
			.content(p.getContent())
			.createdAt(p.getCreatedAt())
			.updatedAt(p.getUpdatedAt())
			.projectCategory(p.getProjectCategory() == null ? null : p.getProjectCategory().name())
			.techCategories(techCategories)
			.techCodes(techCodes)
			.fileUrls(fileUrls)
			.githubUrl(p.getGithubUrl())
			.isPublic(p.getIsPublic())
			.build();
	}
}
