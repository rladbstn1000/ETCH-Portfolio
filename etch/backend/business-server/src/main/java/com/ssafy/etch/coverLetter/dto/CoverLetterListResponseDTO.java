package com.ssafy.etch.coverLetter.dto;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class CoverLetterListResponseDTO {
    private Long id;
    private String name;

    public static CoverLetterListResponseDTO from(CoverLetterDTO coverLetterDTO) {
        return CoverLetterListResponseDTO.builder()
                .id(coverLetterDTO.getId())
                .name(coverLetterDTO.getName())
                .build();
    }
}
