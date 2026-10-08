package com.ssafy.etch.job.dto;

import java.time.LocalDate;

import com.ssafy.etch.job.entity.ApplyStatusType;
import com.ssafy.etch.job.entity.JobEntity;
import com.ssafy.etch.member.entity.MemberEntity;

import lombok.Builder;
import lombok.Getter;

@Builder(toBuilder = true)
@Getter
public class AppliedJobDTO {
	private Long id;
	private MemberEntity member;
	private JobEntity job;
	private ApplyStatusType status;
	private LocalDate createdAt;
	private LocalDate updatedAt;
}
