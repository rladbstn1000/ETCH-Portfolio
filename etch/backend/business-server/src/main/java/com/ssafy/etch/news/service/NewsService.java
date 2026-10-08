package com.ssafy.etch.news.service;

import java.util.List;

import com.ssafy.etch.global.response.PageResponseDTO;
import com.ssafy.etch.news.dto.CompanyNewsDTO;
import com.ssafy.etch.news.dto.LatestNewsDTO;
import com.ssafy.etch.news.dto.RecommendNewsDTO;
import com.ssafy.etch.news.dto.TopCompanyDTO;

public interface NewsService {
	PageResponseDTO<LatestNewsDTO> getLatestNews(int page, int pageSize);
	PageResponseDTO<CompanyNewsDTO> getNewsByCompanyId(Long companyId, int page, int pageSize);
	List<TopCompanyDTO> getTopCompaniesFromRedis();
	List<RecommendNewsDTO> getRecommendNewsFromRedis(Long userId);
}
