package com.ssafy.etch.like.service;

import com.ssafy.etch.company.dto.CompanyLikeResponseDTO;
import com.ssafy.etch.job.dto.JobLikeResponseDTO;
import com.ssafy.etch.like.dto.LikeRequestDTO;
import com.ssafy.etch.like.entity.LikeType;
import com.ssafy.etch.news.dto.NewsLikeResponseDTO;
import com.ssafy.etch.project.dto.ProjectLikeResponseDTO;

import java.util.List;

public interface LikeService {
    void saveLike(Long memberId, LikeRequestDTO likeRequestDTO, LikeType likeType);
    void deleteLike(Long memberId, Long targetId, LikeType likeType);
    List<NewsLikeResponseDTO> getLikedNews(Long memberId);
    List<CompanyLikeResponseDTO> getLikedCompany(Long memberId);
    List<JobLikeResponseDTO> getLikedJob(Long memberId);
    List<ProjectLikeResponseDTO> getLikedProject(Long memberId);
}
