package com.ssafy.etch.like.dto;

import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class LikeRequestDTO {
    private Long targetId;
}
