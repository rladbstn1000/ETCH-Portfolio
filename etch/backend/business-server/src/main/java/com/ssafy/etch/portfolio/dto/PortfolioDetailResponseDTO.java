package com.ssafy.etch.portfolio.dto;

import com.ssafy.etch.project.dto.ProjectListDTO;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.function.Function;

@Builder
@Getter
public class PortfolioDetailResponseDTO {

    private static final String ITEM_DELIMITER = "\\|";
    private static final String FIELD_DELIMITER = "\\^";

    private Long id;
    private Long memberId;
    private String name;
    private String introduce;
    private String githubUrl;
    private String linkedInUrl;
    private String blogUrl;
    private String email;
    private String phoneNumber;
    private List<String> techList;
    private List<EduAndActDTO> education;
    private List<CertAndLangDTO> language;
    private List<ProjectListDTO> projectList;
    private LocalDate updatedAt;

    public static PortfolioDetailResponseDTO from(PortfolioDTO portfolioDTO, List<String> techList) {
        return builder()
                .id(portfolioDTO.getId())
                .memberId(portfolioDTO.getMember().getId())
                .name(portfolioDTO.getName())
                .introduce(portfolioDTO.getIntroduce())
                .githubUrl(portfolioDTO.getGithubUrl())
                .linkedInUrl(portfolioDTO.getLinkedInUrl())
                .blogUrl(portfolioDTO.getBlogUrl())
                .email(portfolioDTO.getEmail())
                .phoneNumber(portfolioDTO.getPhoneNumber())
                .techList(techList)
                .updatedAt(portfolioDTO.getUpdatedAt())
                .education(parseDelimitedString(
                        portfolioDTO.getEducation(),
                        info -> EduAndActDTO.builder()
                                .name(getValue(info, 0))
                                .description(getValue(info, 1))
                                .startDate(parseDate(info, 2))
                                .endDate(parseDate(info, 3))
                                .build()
                ))
                .language(parseDelimitedString(
                        portfolioDTO.getLanguage(),
                        info -> CertAndLangDTO.builder()
                                .name(getValue(info, 0))
                                .date(parseDate(info, 1))
                                .certificateIssuer(getValue(info, 2))
                                .build()
                ))
                .projectList(portfolioDTO.getProject() == null ? Collections.emptyList() : portfolioDTO.getProject().stream()
                        .map(p -> ProjectListDTO.from(p.getProject().toProjectDTO()))
                        .toList())
                .build();
    }

    private static <T> List<T> parseDelimitedString(String source, Function<String[], T> mapper) {
        if (source == null || source.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(source.split(ITEM_DELIMITER))
                .map(segment -> mapper.apply(segment.split(FIELD_DELIMITER, -1)))
                .toList();
    }

    private static String getValue(String[] info, int index) {
        return info.length > index && !info[index].isBlank() ? info[index] : null;
    }

    private static LocalDate parseDate(String[] info, int index) {
        return info.length > index && !info[index].isBlank()
                ? LocalDate.parse(info[index])
                : null;
    }
}
