package com.ssafy.etch.job.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.ssafy.etch.job.dto.AppliedRatesResponseDTO;
import com.ssafy.etch.job.dto.CategoryShareDTO;
import com.ssafy.etch.job.dto.MonthlyItemDTO;
import com.ssafy.etch.job.repository.AppliedJobRepository;
import com.ssafy.etch.job.statistics.StatsRow;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AppliedStatsServiceImpl implements AppliedStatsService {

	private final AppliedJobRepository appliedJobRepository;

	@Override
	public AppliedRatesResponseDTO getRates(Long memberId) {
		StatsRow s = appliedJobRepository.fetchRateStatsAll(memberId);

		double documentPassRate = rate(s.getDocPassCnt(), s.getDocTotalCnt());
		double interviewPassRate = rate(s.getInterviewPassCnt(), s.getInterviewTotalCnt());
		double finalOfferRate = rate(s.getFinalCnt(), s.getFinalTotalCnt());

		return new AppliedRatesResponseDTO(documentPassRate, interviewPassRate, finalOfferRate);
	}

	@Override
	public AppliedRatesResponseDTO getRatesWithDate(Long memberId, LocalDate from, LocalDate to) {
		LocalDateTime fromTs = (from == null) ? null : from.atStartOfDay();
		LocalDateTime toTs = (to == null) ? null : to.plusDays(1).atStartOfDay();

		StatsRow s = appliedJobRepository.fetchRateStats(memberId, fromTs, toTs);

		double documentPassRate = rate(s.getDocPassCnt(), s.getDocTotalCnt());
		double interviewPassRate = rate(s.getInterviewPassCnt(), s.getInterviewTotalCnt());
		double finalOfferRate = rate(s.getFinalCnt(), s.getFinalTotalCnt());

		return new AppliedRatesResponseDTO(documentPassRate, interviewPassRate, finalOfferRate);
	}

	@Override
	public List<MonthlyItemDTO> getMonthlyCounts(Long memberId, int year, int month, boolean excludeScheduled) {
		return appliedJobRepository.fetchMonthlyCountOfMonth(memberId, year, month, excludeScheduled ? 1 : 0).stream()
			.map(r -> new MonthlyItemDTO(r.getYm(), r.getCnt()))
			.toList();
	}

	@Override
	public List<CategoryShareDTO> getCategoryShare(Long memberId, boolean excludeScheduled) {
		int flag = excludeScheduled ? 1 : 0;
		return appliedJobRepository.fetchCategoryShare(memberId, flag)
			.stream()
			.map(r -> new CategoryShareDTO(r.getCategory(), r.getCnt(), r.getPct()))
			.toList();
	}

	private double rate(Long num, Long den) {
		long n = (num == null) ? 0 : num;
		long d = (den == null) ? 0 : den;
		return d == 0 ? 0.0 : Math.round((n * 1_0000.0 / d)) / 1_0000.0; // 소수 4자리 반올림
	}
}
