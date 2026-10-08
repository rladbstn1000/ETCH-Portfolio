package com.ssafy.etch.follow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowCountResponseDTO {
    private Long followerCount;
    private Long followingCount;
}
