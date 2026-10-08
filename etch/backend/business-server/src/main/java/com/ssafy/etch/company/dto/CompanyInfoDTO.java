package com.ssafy.etch.company.dto;

import java.time.LocalDate;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class CompanyInfoDTO {
	private Long id;
	private String name;
	private String industry;
	private String mainProducts;
	private String ceoName;
	private String summary;
	private String stock;
	private String address;
	private String homepageUrl;
	private LocalDate foundedDate;
	private Long totalEmployees;
	private Long maleEmployees;
	private Long femaleEmployees;
	private Double maleRatio;
	private Double femaleRatio;
	private Long salary;
	private Long serviceYear;

	public static CompanyInfoDTO from(CompanyDTO companyDTO) {
		return CompanyInfoDTO.builder()
			.id(companyDTO.getId())
			.name(companyDTO.getName())
			.industry(companyDTO.getIndustry())
			.mainProducts(companyDTO.getMainProducts())
			.ceoName(companyDTO.getCeoName())
			.summary(companyDTO.getSummary())
			.stock(companyDTO.getStock())
			.address(companyDTO.getAddress())
			.homepageUrl(companyDTO.getHomepageUrl())
			.foundedDate(companyDTO.getFoundedDate())
			.totalEmployees(companyDTO.getTotalEmployees())
			.maleEmployees(companyDTO.getMaleEmployees())
			.femaleEmployees(companyDTO.getFemaleEmployees())
			.maleRatio(companyDTO.getMaleRatio())
			.femaleRatio(companyDTO.getFemaleRatio())
			.salary(companyDTO.getSalary())
			.serviceYear(companyDTO.getServiceYear())
			.build();
	}
}
