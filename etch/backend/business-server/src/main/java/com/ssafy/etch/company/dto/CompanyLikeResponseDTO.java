package com.ssafy.etch.company.dto;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class CompanyLikeResponseDTO {
    private Long id;
    private String name;
    private String industry;

    public static CompanyLikeResponseDTO from(CompanyDTO companyDTO) {
        return CompanyLikeResponseDTO.builder()
                .id(companyDTO.getId())
                .name(companyDTO.getName())
                .industry(companyDTO.getIndustry())
                .build();
    }
}
