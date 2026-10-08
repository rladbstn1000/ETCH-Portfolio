package com.ssafy.etch.job.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import com.ssafy.etch.global.exception.CustomException;
import com.ssafy.etch.global.exception.ErrorCode;
import com.ssafy.etch.job.dto.JobDTO;
import com.ssafy.etch.job.dto.JobResponseDTO;
import com.ssafy.etch.job.dto.RecommendJobDTO;
import com.ssafy.etch.job.entity.JobEntity;
import com.ssafy.etch.job.repository.JobRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class JobServiceImpl implements JobService {
	private final JobRepository jobRepository;
	private final RedisTemplate<String, Object> redisTemplate;
	private final ObjectMapper objectMapper;

	@Override
	public JobResponseDTO getJob(Long jobId) {
		JobDTO jobDTO = jobRepository.findById(jobId)
			.map(JobEntity::toJobDTO)
			.orElseThrow(() -> new CustomException(ErrorCode.JOB_NOT_FOUND));

		return JobResponseDTO.from(jobDTO);
	}

	@Override
	public List<JobResponseDTO> getJobsByDate(LocalDate startDate, LocalDate endDate) {
		LocalDateTime startInclusive = startDate.atStartOfDay();       // yyyy-MM-dd 00:00:00
		LocalDateTime endExclusive = endDate.plusDays(1).atStartOfDay();

		// ✅ 순서: startInclusive, endExclusive
		List<JobEntity> jobEntityList = jobRepository.findJobsStartingOrEndingInPeriod(startInclusive, endExclusive);

		return jobEntityList.stream().map(e -> JobResponseDTO.from(e.toJobDTO())).toList();
	}

	@Override
	public List<JobResponseDTO> getJobsByExpirationDate(LocalDate startDate, LocalDate endDate) {
		LocalDateTime startInclusive = startDate.atStartOfDay();       // yyyy-MM-dd 00:00:00
		LocalDateTime endExclusive = endDate.plusDays(1).atStartOfDay();

		List<JobEntity> jobEntityList = jobRepository.findByExpirationDateInPeriod(startInclusive, endExclusive);

		return jobEntityList.stream().map(e -> JobResponseDTO.from(e.toJobDTO())).toList();
	}

	@Override
	public List<RecommendJobDTO> getRecommendJobFromRedis(Long userId) {
		// redis에서 userId를 key로 해서 json 형태의 데이터 조회
		String redisKey = "recommendations_data_user_" + userId;
		String jsonData = (String)redisTemplate.opsForValue().get(redisKey);

		if (jsonData == null || jsonData.isEmpty()) {
			throw new CustomException(ErrorCode.JOB_NOT_FOUND);
		}

		try {
			// JSON 문자열을 Map으로 파싱
			TypeReference<Map<String, List<List<Object>>>> typeRef = new TypeReference<>() {
			};
			Map<String, List<List<Object>>> recommendationsMap = objectMapper.readValue(jsonData, typeRef);

			List<List<Object>> jobRecommendations = recommendationsMap.get("job");
			if (jobRecommendations == null || jobRecommendations.isEmpty()) {
				throw new CustomException(ErrorCode.JOB_NOT_FOUND);
			}

			// 파싱된 데이터에서 채용공고 ID 목록(String)을 추출 -> Long 타입 리스트로 변환
			List<Long> recommendedIds = jobRecommendations.stream()
				.map(recommendation -> Long.valueOf(String.valueOf(recommendation.get(0))))
				.collect(Collectors.toList());

			// 채용공고 ID 리스트 -> DB에서 뉴스 엔티티들을 한 번에 조회
			Map<Long, JobEntity> jobEntityMap = jobRepository.findAllById(recommendedIds).stream()
				.collect(Collectors.toMap(JobEntity::getId, Function.identity()));

			// NewsEntity를 RecommendNewsDTO로 변환
			return recommendedIds.stream()
				.map(jobEntityMap::get)
				.filter(java.util.Objects::nonNull) // DB에 존재하지 않는 ID가 있을 경우 필터링
				.map(newsEntity -> RecommendJobDTO.from(newsEntity.toJobDTO()))
				.collect(Collectors.toList());

		} catch (JacksonException e) {
			e.printStackTrace();
			return Collections.emptyList();
		}
	}
}
