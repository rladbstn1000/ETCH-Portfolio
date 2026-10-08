package com.ssafy.etch.project.dto;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.ssafy.etch.project.entity.ProjectCategory;

import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectUpdateRequestDTO {
	private String title;
	private String content;
	private ProjectCategory projectCategory;
	private List<Long> techCodeIds;
	private String githubUrl;
	private Boolean isPublic;

	private MultipartFile thumbnail; // 새 썸네일
	private Boolean removeThumbnail; // true: 기존 썸네일 삭제

	private List<Long> removeFileIds; // 삭제할 본문 이미지 파일 id들
	private List<MultipartFile> newImages; // 추가할 새 이미지 파일들

	private String youtubeUrl; // 새 youtube 링크
}
