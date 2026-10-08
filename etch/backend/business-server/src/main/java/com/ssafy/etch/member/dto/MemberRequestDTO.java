package com.ssafy.etch.member.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class MemberRequestDTO {
    private String gender;
    private String nickname;
    private String phoneNumber;
    private String birth;
}
