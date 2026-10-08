package com.ssafy.etch.portfolio.dto;

import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Builder(toBuilder = true)
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioRequestDTO {
    private String name;
    private String introduce;
    private String githubUrl;
    private String linkedInUrl;
    private String blogUrl;
    private String phoneNumber;
    private String email;
    private List<String> techList;
    private String education;
    private String language;
    private Long memberId;
    private List<Long> projectIds;

    public PortfolioDTO toPortfolioDTO(String techList) {
        return PortfolioDTO.builder()
                .name(name)
                .introduce(introduce)
                .githubUrl(githubUrl)
                .linkedInUrl(linkedInUrl)
                .blogUrl(blogUrl)
                .phoneNumber(phoneNumber)
                .email(email)
                .techList(techList)
                .education(education)
                .language(language)
                .build();
    }
}
