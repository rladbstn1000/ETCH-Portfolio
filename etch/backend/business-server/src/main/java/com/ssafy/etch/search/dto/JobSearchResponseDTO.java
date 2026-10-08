package com.ssafy.etch.search.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.ssafy.etch.search.document.JobDocument;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class JobSearchResponseDTO {
	private Long id;
	private String title;
	private String companyName;
	private List<String> industries;
	private List<String> regions;
	private List<String> jobCategories;
	private String workType;
	private String educationLevel;
	private LocalDateTime openingDate;
	private LocalDateTime expirationDate;

	public static JobSearchResponseDTO from(JobDocument jobDocument) {
		return JobSearchResponseDTO.builder()
			.id(jobDocument.getJobId())
			.title(jobDocument.getTitle())
			.companyName(jobDocument.getCompanyName())
			.industries(jobDocument.getIndustries())
			.regions(jobDocument.getRegions())
			.jobCategories(jobDocument.getJobCategories())
			.workType(jobDocument.getWorkType())
			.educationLevel(jobDocument.getEducationLevel())
			.openingDate(jobDocument.getOpeningDate())
			.expirationDate(jobDocument.getExpirationDate())
			.build();
	}

}
