package com.ssafy.etch.member.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder(toBuilder = true)
public class MemberDTO {
    private Long id;
    private String nickname;
    private String email;
    private String phoneNumber;
    private String profile;
    private String gender;
    private String birth;
    private String role;
    private boolean isDeleted;
    private String refreshToken;

}
