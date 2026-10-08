package com.ssafy.etch.company.dto;

import com.ssafy.etch.job.entity.JobEntity;
import com.ssafy.etch.news.entity.NewsEntity;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Builder
@Getter
public class CompanyDTO {
    private Long id;
    private String name;
    private String industry;
    private String mainProducts;
    private String ceoName;
    private String summary;
    private String stock;
    private String businessNo;
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
    private List<NewsEntity> newsList;
    //private List<FinanceEntity> financeList;
    private List<JobEntity> jobList;
}
