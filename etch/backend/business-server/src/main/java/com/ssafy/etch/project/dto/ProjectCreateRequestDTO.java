package com.ssafy.etch.project.dto;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.ssafy.etch.project.entity.ProjectCategory;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectCreateRequestDTO {

	@NotBlank
	private String title;

	@NotBlank @Size(max = 10000)
	private String content;

	@NotNull
	private ProjectCategory projectCategory; // 프로젝트 자체 분류

	@NotNull @Size(min = 1)
	private List<Long> techCodeIds; // 기술스택 ID 분류

	@Pattern(regexp = "^(https?://github\\.com/.+)?$")
	private String githubUrl;
	
	private MultipartFile thumbnail; // 썸네일
	private List<MultipartFile> images; // 본문 사진
	private String youtubeUrl;

	@NotNull
	private Boolean isPublic;
}
