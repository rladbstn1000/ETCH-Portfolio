package com.ssafy.etch.project.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.ssafy.etch.global.response.PageResponseDTO;
import com.ssafy.etch.project.dto.ProjectCreateRequestDTO;
import com.ssafy.etch.project.dto.ProjectDetailDTO;
import com.ssafy.etch.project.dto.ProjectListDTO;
import com.ssafy.etch.project.dto.ProjectUpdateRequestDTO;

public interface ProjectService {
	PageResponseDTO<ProjectListDTO> getAllProjects(String sort, int page, int pageSize);
	PageResponseDTO<ProjectListDTO> getPublicProjectByUser(Long memberId, int page, int pageSize);
	ProjectDetailDTO getProjectById(long id, Long memberId);
	Long createProject(Long memberId, ProjectCreateRequestDTO req, MultipartFile thumbnail, List<MultipartFile> images);
	void deleteProject(Long projectId, Long memberId);
	void updateProject(Long projectId, Long memberId, ProjectUpdateRequestDTO req, MultipartFile thumbnail, List<MultipartFile> images);
	List<ProjectListDTO> getProjectsByMemberId(Long memberId);
}
