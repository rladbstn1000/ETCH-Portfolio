package com.ssafy.etch.like.dto;

import com.ssafy.etch.like.entity.LikeType;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class LikeDTO {
    private Long id;
    private Long memberId;
    private Long targetId;
    private LikeType type;
}
