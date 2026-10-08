package com.ssafy.etch.company.entity;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.ssafy.etch.company.dto.CompanyDTO;
import com.ssafy.etch.job.entity.JobEntity;
import com.ssafy.etch.news.entity.NewsEntity;

import jakarta.persistence.*;
import lombok.Getter;

@Entity
@Table(name="company")
@Getter
public class CompanyEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(unique = true, nullable = false)
	private String name;

	private String industry;

	@Column(name = "main_products")
	private String mainProducts;

	@Column(name = "ceo_name")
	private String ceoName;

	@Column(columnDefinition = "TEXT")
	private String summary;

	private String stock;

	@Column(name = "business_no")
	private String businessNo;
	private String address;

	@Column(name = "homepage_url")
	private String homepageUrl;

	@Column(name = "founded_date")
	private LocalDate foundedDate;

	@Column(name = "total_employees")
	private Long totalEmployees;

	@Column(name = "male_employees")
	private Long maleEmployees;

	@Column(name = "female_employees")
	private Long femaleEmployees;

	@Column(name = "male_ratio")
	private Double maleRatio;

	@Column(name = "female_ratio")
	private Double femaleRatio;

	private Long salary;

	@Column(name = "service_year")
	private Long serviceYear;

	// 기업 1: 뉴스 N
	@OneToMany(mappedBy = "company", fetch = FetchType.LAZY, orphanRemoval = false)
	private List<NewsEntity> newsList = new ArrayList<>();

	// 기업 1: 재무 N
	//@OneToMany(mappedBy = "company", fetch = FetchType.LAZY, cascade = CascadeType.NONE, orphanRemoval = false)
	//private List<FinanceEntity> financeList = new ArrayList<>();

	// 기업 1: 채용공고 N
	@OneToMany(mappedBy = "company", fetch = FetchType.LAZY, orphanRemoval = false)
	private List<JobEntity> jobList = new ArrayList<>();

	public CompanyDTO toCompanyDTO() {
		return CompanyDTO.builder()
				.id(id)
				.name(name)
				.industry(industry)
				.mainProducts(mainProducts)
				.ceoName(ceoName)
				.summary(summary)
				.stock(stock)
				.businessNo(businessNo)
				.address(address)
				.homepageUrl(homepageUrl)
				.foundedDate(foundedDate)
				.totalEmployees(totalEmployees)
				.maleEmployees(maleEmployees)
				.femaleEmployees(femaleEmployees)
				.maleRatio(maleRatio)
				.femaleRatio(femaleRatio)
				.salary(salary)
				.serviceYear(serviceYear)
				.build();
	}
}
