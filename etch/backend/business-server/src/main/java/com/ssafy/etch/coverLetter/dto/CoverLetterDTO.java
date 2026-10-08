package com.ssafy.etch.coverLetter.dto;

import com.ssafy.etch.member.entity.MemberEntity;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;

@Builder(toBuilder = true)
@Getter
public class CoverLetterDTO {
    private Long id;
    private String name;
    private String answer1;
    private String answer2;
    private String answer3;
    private String answer4;
    private String answer5;
    private boolean isDeleted;
    private MemberEntity member;
}
