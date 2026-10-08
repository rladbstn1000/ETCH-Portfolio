package com.ssafy.etch.job.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.ssafy.etch.company.entity.CompanyEntity;
import com.ssafy.etch.job.dto.JobDTO;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;

@Entity
@Table(name = "job")
@Getter
public class JobEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String title;

	@Column(name = "company_name")
	private String companyName;

	@Column(name = "region")
	private String region;

	@Column(name = "industry")
	private String industry;

	@Column(name = "job_category")
	private String jobCategory;

	@Column(name = "work_type")
	private String workType;

	@Column(name = "education_level")
	private String educationLevel;

	@Column(name = "opening_date")
	private LocalDateTime openingDate;

	@Column(name = "expiration_date")
	private LocalDateTime expirationDate;

	@Column(name = "created_at")
	private LocalDate createdAt;

	@Column(name = "updated_at")
	private LocalDateTime updatedAt;

	@Column(name = "external_job_id", unique = true, nullable = false)
	private String externalJobId;

	@ManyToOne
	@JoinColumn(name = "company_id", nullable = false)
	private CompanyEntity company;

	public JobDTO toJobDTO() {
		return JobDTO.builder()
			.id(id)
			.title(title)
			.companyName(companyName)
			.companyId(company.getId())
			.region(region)
			.industry(industry)
			.jobCategory(jobCategory)
			.workType(workType)
			.educationLevel(educationLevel)
			.openingDate(openingDate)
			.expirationDate(expirationDate)
			.createdAt(createdAt)
			.updatedAt(updatedAt)
			.build();
	}
}
