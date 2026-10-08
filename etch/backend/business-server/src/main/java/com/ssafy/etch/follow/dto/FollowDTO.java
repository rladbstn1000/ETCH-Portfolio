package com.ssafy.etch.follow.dto;

import com.ssafy.etch.member.dto.MemberDTO;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class FollowDTO {
    private MemberDTO follower;
    private MemberDTO following;
}
