package com.ssafy.etch.coverLetter.dto;

import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CoverLetterRequestDTO {
    private String name;
    private String answer1;
    private String answer2;
    private String answer3;
    private String answer4;
    private String answer5;

    public CoverLetterDTO toCoverLetterDTO() {
        return CoverLetterDTO.builder()
                .name(name)
                .answer1(answer1)
                .answer2(answer2)
                .answer3(answer3)
                .answer4(answer4)
                .answer5(answer5)
                .build();
    }
}
