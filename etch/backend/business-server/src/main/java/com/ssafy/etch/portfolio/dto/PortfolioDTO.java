package com.ssafy.etch.portfolio.dto;

import com.ssafy.etch.member.entity.MemberEntity;
import com.ssafy.etch.portfolio.entity.PortfolioProjectEntity;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Builder(toBuilder = true)
@Getter
public class PortfolioDTO {
    private Long id;
    private String name;
    private String introduce;
    private String githubUrl;
    private String linkedInUrl;
    private String blogUrl;
    private String email;
    private String phoneNumber;
    private String techList;
    private String education;
    private String language;
    private LocalDate createdAt;
    private LocalDate updatedAt;
    private boolean isDeleted;
    private MemberEntity member;
    private List<PortfolioProjectEntity> project;
}
