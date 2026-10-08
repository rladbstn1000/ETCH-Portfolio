package com.ssafy.etch.news.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class TopCompanyDTO {
	private Long companyId;
	private Long articleCount;
	private String companyName;
	private Long likeCount;
	private Integer rank;
}
