package com.ssafy.etch.job.dto;

import com.ssafy.etch.job.entity.ApplyStatusType;
import lombok.Getter;

@Getter
public class AppliedJobUpdateRequestDTO {
    private ApplyStatusType status;
}
