package com.ssafy.etch.news.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import tools.jackson.core.type.TypeReference;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import com.ssafy.etch.global.response.PageResponseDTO;
import com.ssafy.etch.news.dto.CompanyNewsDTO;
import com.ssafy.etch.news.dto.LatestNewsDTO;
import com.ssafy.etch.news.dto.RecommendNewsDTO;
import com.ssafy.etch.news.dto.TopCompanyDTO;
import com.ssafy.etch.news.entity.NewsEntity;
import com.ssafy.etch.news.repository.NewsRepository;

@Service
public class NewsServiceImpl implements NewsService {

	private final NewsRepository newsRepository;
	private final RedisTemplate<String, Object> redisTemplate;
	private final ObjectMapper objectMapper;
	private static final int MAX_PAGE_SIZE = 10;

	public NewsServiceImpl(NewsRepository newsRepository, RedisTemplate<String, Object> redisTemplate, ObjectMapper objectMapper) {
		this.newsRepository = newsRepository;
		this.redisTemplate = redisTemplate;
		this.objectMapper = objectMapper;
	}

	@Override
	public PageResponseDTO<LatestNewsDTO> getLatestNews(int page, int pageSize) {
		final int pageIndex = Math.max(0, page - 1);
		final int size = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);

		Pageable pageable = PageRequest.of(pageIndex, size);

		Page<NewsEntity> newsEntityPage = newsRepository.findAllByOrderByPublishedAtDesc(pageable);
		Page<LatestNewsDTO> dtoPage = newsEntityPage.map(newsEntity -> LatestNewsDTO.from(newsEntity.toNewsDTO()));

		return new PageResponseDTO<>(dtoPage);
	}

	@Override
	public PageResponseDTO<CompanyNewsDTO> getNewsByCompanyId(Long companyId, int page, int pageSize) {
		final int pageIndex = Math.max(0, page - 1);
		final int size = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);

		Pageable pageable = PageRequest.of(pageIndex, size);

		Page<NewsEntity> newsEntityPage = newsRepository.findAllByCompanyIdOrderByPublishedAtDesc(companyId, pageable);
		Page<CompanyNewsDTO> dtoPage = newsEntityPage.map(newsEntity -> CompanyNewsDTO.from(newsEntity.toNewsDTO()));

		return new PageResponseDTO<>(dtoPage);
	}

	@Override
	public List<TopCompanyDTO> getTopCompaniesFromRedis() {
		List<Object> keys = redisTemplate.opsForList().range("top10_companies", 0, -1);
		if (keys == null) return Collections.emptyList();

		List<TopCompanyDTO> result = new ArrayList<>();
		int rank = 1;

		for (Object key : keys) {
			Map<Object, Object> map = redisTemplate.opsForHash().entries((String)key);
			if (map.isEmpty()) continue;

			TopCompanyDTO dto = TopCompanyDTO.builder()
				.companyId(Long.valueOf((String) map.get("company_id")))
				.companyName((String) map.get("company_name"))
				.likeCount(Long.valueOf((String) map.get("likes")))
				.articleCount(Long.valueOf((String) map.get("article_count")))
				.rank(rank++)
				.build();

			result.add(dto);
		}

		return result;
	}

	/**
	 * redis에서 추천기사ID목록이 있는 json 가져와서 파싱하고,
	 * db에서 기사ID로 정보 조회해서 결과 반환
	 */
	@Override
	public List<RecommendNewsDTO> getRecommendNewsFromRedis(Long userId) {

		// redis에서 userId를 key로 해서 json 형태의 데이터 조회
		String redisKey = "recommendations_data_user_" + userId;
		String jsonData = (String) redisTemplate.opsForValue().get(redisKey);

		if (jsonData == null || jsonData.isEmpty()) {
			return Collections.emptyList();
		}

		try {
			// JSON 문자열을 Map으로 파싱
			TypeReference<Map<String, List<List<Object>>>> typeRef = new TypeReference<>() {};
			Map<String, List<List<Object>>> recommendationsMap = objectMapper.readValue(jsonData, typeRef);

			List<List<Object>> newsRecommendations = recommendationsMap.get("news");
			if (newsRecommendations == null || newsRecommendations.isEmpty()) {
				return Collections.emptyList();
			}

			// 파싱된 데이터에서 뉴스 ID 목록(String)을 추출 -> Long 타입 리스트로 변환
			List<Long> recommendedIds = newsRecommendations.stream()
				.map(recommendation -> Long.valueOf(String.valueOf(recommendation.get(0))))
				.collect(Collectors.toList());

			// 뉴스 ID 리스트 -> DB에서 뉴스 엔티티들을 한 번에 조회
			Map<Long, NewsEntity> newsEntityMap = newsRepository.findAllById(recommendedIds).stream()
				.collect(Collectors.toMap(NewsEntity::getId, Function.identity()));

			// NewsEntity를 RecommendNewsDTO로 변환
			return recommendedIds.stream()
				.map(newsEntityMap::get)
				.filter(java.util.Objects::nonNull) // DB에 존재하지 않는 ID가 있을 경우 필터링
				.map(newsEntity -> RecommendNewsDTO.from(newsEntity.toNewsDTO()))
				.collect(Collectors.toList());

		} catch (JacksonException e) {
			e.printStackTrace();
			return Collections.emptyList();
		}
	}
}
