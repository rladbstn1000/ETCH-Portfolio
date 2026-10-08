package com.ssafy.etch.portfolio.entity;

import com.ssafy.etch.member.entity.MemberEntity;
import com.ssafy.etch.portfolio.dto.PortfolioDTO;
import com.ssafy.etch.portfolio.dto.PortfolioRequestDTO;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "portfolio")
public class PortfolioEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String introduce;

    @Column(name = "github_url")
    private String githubUrl;

    @Column(name = "linkedIn_url")
    private String linkedInUrl;

    @Column(name = "blog_url")
    private String blogUrl;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "email")
    private String email;

    @Column(name = "tech_list", length = 1000)
    private String techList;

    @Column(name = "education", length = 2000)
    private String education;

    @Column(name = "language", length = 2000)
    private String language;

    @Column(name = "created_at")
    private LocalDate createdAt;

    @Column(name = "updated_at")
    private LocalDate updatedAt;

    @Column(name = "is_deleted")
    private boolean isDeleted = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private MemberEntity member;

    @OneToMany(mappedBy = "portfolio")
    private List<PortfolioProjectEntity> project =  new ArrayList<>();

    public PortfolioDTO toPortfolioDTO() {
        return PortfolioDTO.builder()
                .id(id)
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
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .isDeleted(isDeleted)
                .member(member)
                .project(project)
                .build();
    }

    public static PortfolioEntity from(PortfolioDTO portfolioDTO) {
        PortfolioEntity portfolioEntity = new PortfolioEntity();
        portfolioEntity.id = portfolioDTO.getId();
        portfolioEntity.name = portfolioDTO.getName();
        portfolioEntity.introduce = portfolioDTO.getIntroduce();
        portfolioEntity.githubUrl = portfolioDTO.getGithubUrl();
        portfolioEntity.linkedInUrl = portfolioDTO.getLinkedInUrl();
        portfolioEntity.blogUrl = portfolioDTO.getBlogUrl();
        portfolioEntity.phoneNumber = portfolioDTO.getPhoneNumber();
        portfolioEntity.email = portfolioDTO.getEmail();
        portfolioEntity.techList = portfolioDTO.getTechList();
        portfolioEntity.education = portfolioDTO.getEducation();
        portfolioEntity.language = portfolioDTO.getLanguage();
        portfolioEntity.createdAt = portfolioDTO.getCreatedAt();
        portfolioEntity.updatedAt = portfolioDTO.getUpdatedAt();
        portfolioEntity.isDeleted = portfolioDTO.isDeleted();
        portfolioEntity.member = portfolioDTO.getMember();
        portfolioEntity.project = portfolioDTO.getProject();
        return portfolioEntity;
    }

    public static void updateProjectInfo(PortfolioEntity portfolioEntity, List<PortfolioProjectEntity> project) {
        portfolioEntity.project = project;
    }

    public void updateAll(PortfolioRequestDTO portfolioRequestDTO, String list, List<PortfolioProjectEntity> newProject) {
        name = portfolioRequestDTO.getName();
        introduce = portfolioRequestDTO.getIntroduce();
        githubUrl = portfolioRequestDTO.getGithubUrl();
        linkedInUrl = portfolioRequestDTO.getLinkedInUrl();
        blogUrl = portfolioRequestDTO.getBlogUrl();
        phoneNumber = portfolioRequestDTO.getPhoneNumber();
        email = portfolioRequestDTO.getEmail();
        techList = list;
        education = portfolioRequestDTO.getEducation();
        language = portfolioRequestDTO.getLanguage();
        updatedAt = LocalDate.now();
        project = newProject;
    }

    public void clear() {
        project.clear();
    }

    public void updateStatus() {
        isDeleted = true;
    }
}
