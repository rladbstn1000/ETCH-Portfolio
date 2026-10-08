package com.ssafy.etch.project.dto;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class ProjectLikeResponseDTO {
    private Long id;
    private String title;
    private String thumbnailUrl;
    private Long viewCount;
    private Boolean isDeleted;
    private String nickname;

    public static ProjectLikeResponseDTO from(ProjectDTO projectDTO) {
        return ProjectLikeResponseDTO.builder()
                .id(projectDTO.getId())
                .title(projectDTO.getTitle())
                .thumbnailUrl(projectDTO.getThumbnailUrl())
                .viewCount(projectDTO.getViewCount())
                .isDeleted(projectDTO.getIsDeleted())
                .nickname(projectDTO.getMember().toMemberDTO().getNickname())
                .build();
    }
}
