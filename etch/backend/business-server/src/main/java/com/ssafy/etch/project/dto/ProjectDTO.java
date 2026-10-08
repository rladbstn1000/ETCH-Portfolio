package com.ssafy.etch.project.dto;

import com.ssafy.etch.comment.entity.CommentEntity;
import com.ssafy.etch.file.entity.FileEntity;
import com.ssafy.etch.member.entity.MemberEntity;

import com.ssafy.etch.project.entity.ProjectCategory;
import com.ssafy.etch.project.entity.ProjectTechEntity;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Builder(toBuilder = true)
@Getter
public class ProjectDTO {
    private Long id;
    private String title;
    private String content;
    private String thumbnailUrl;
    private String youtubeUrl;
    private Long viewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isDeleted;
    private String githubUrl;
    private Boolean isPublic;
    private MemberEntity member;
    private ProjectCategory projectCategory;
    private List<ProjectTechEntity> projectTechs;
    private List<CommentEntity> comments;
    private List<FileEntity> files;
    private Integer likeCount;
    private Integer commentCount;
    private Double popularityScore;
}
