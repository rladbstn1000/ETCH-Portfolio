package com.ssafy.etch.job.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class JobDTO {
	private Long id;
	private String title;
	private Long companyId;
	private String companyName;
	private String region;
	private String industry;
	private String jobCategory;
	private String workType;
	private String educationLevel;
	private LocalDateTime openingDate;
	private LocalDateTime expirationDate;
	private LocalDate createdAt;
	private LocalDateTime updatedAt;
}
