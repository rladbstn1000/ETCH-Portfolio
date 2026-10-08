package com.ssafy.etch.job.service;

import com.ssafy.etch.job.dto.AppliedJobListResponseDTO;
import com.ssafy.etch.job.entity.ApplyStatusType;

import java.util.List;

public interface AppliedJobService {
    void createAppliedJob(Long memberId, Long jobId);
    List<AppliedJobListResponseDTO> getAppliedJobList(Long memberId);
    void updateAppliedJobStatus(Long memberId, Long appliedJobId, ApplyStatusType status);
    void deleteAppliedJob(Long memberId, Long appliedJobId);
}
