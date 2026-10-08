package com.ssafy.etch.job.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.ssafy.etch.global.util.CsvUtil;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class JobResponseDTO {
	private Long id;
	private String title;
	private Long companyId;
	private String companyName;
	private List<String> regions;
	private List<String> industries;
	private List<String> jobCategories;
	private String workType;
	private String educationLevel;
	private LocalDateTime openingDate;
	private LocalDateTime expirationDate;

	public static JobResponseDTO from(JobDTO jobDTO) {
		return JobResponseDTO.builder()
			.id(jobDTO.getId())
			.title(jobDTO.getTitle())
			.companyId(jobDTO.getCompanyId())
			.companyName(jobDTO.getCompanyName())
			.regions(CsvUtil.splitCsv(jobDTO.getRegion()))
			.industries(CsvUtil.splitCsv(jobDTO.getIndustry()))
			.jobCategories(CsvUtil.splitCsv(jobDTO.getJobCategory()))
			.workType(jobDTO.getWorkType())
			.educationLevel(jobDTO.getEducationLevel())
			.openingDate(jobDTO.getOpeningDate())
			.expirationDate(jobDTO.getExpirationDate())
			.build();
	}
}
