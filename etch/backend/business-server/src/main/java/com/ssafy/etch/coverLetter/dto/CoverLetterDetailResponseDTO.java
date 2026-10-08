package com.ssafy.etch.coverLetter.dto;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class CoverLetterDetailResponseDTO {
    private Long id;
    private String name;
    private String answer1;
    private String answer2;
    private String answer3;
    private String answer4;
    private String answer5;

    public static CoverLetterDetailResponseDTO from(CoverLetterDTO coverLetterDTO) {
        return CoverLetterDetailResponseDTO.builder()
                .id(coverLetterDTO.getId())
                .name(coverLetterDTO.getName())
                .answer1(coverLetterDTO.getAnswer1())
                .answer2(coverLetterDTO.getAnswer2())
                .answer3(coverLetterDTO.getAnswer3())
                .answer4(coverLetterDTO.getAnswer4())
                .answer5(coverLetterDTO.getAnswer5())
                .build();
    }
}
