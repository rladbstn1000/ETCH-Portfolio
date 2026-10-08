package com.ssafy.etch.job.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class RecommendJobDTO {
	private Long id;
	private String title;
	private String companyName;
	private String region;
	private String industry;
	private String jobCategory;
	private String workType;
	private String educationLevel;
	private LocalDateTime openingDate;
	private LocalDateTime expirationDate;

	public static RecommendJobDTO from(JobDTO jobDTO) {
		return RecommendJobDTO.builder()
			.id(jobDTO.getId())
			.title(jobDTO.getTitle())
			.companyName(jobDTO.getCompanyName())
			.region(jobDTO.getRegion())
			.industry(jobDTO.getIndustry())
			.jobCategory(jobDTO.getJobCategory())
			.workType(jobDTO.getWorkType())
			.educationLevel(jobDTO.getEducationLevel())
			.openingDate(jobDTO.getOpeningDate())
			.expirationDate(jobDTO.getExpirationDate())
			.build();
	}
}
