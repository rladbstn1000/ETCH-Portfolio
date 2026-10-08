package com.ssafy.etch.job.service;

import com.ssafy.etch.global.exception.CustomException;
import com.ssafy.etch.global.exception.ErrorCode;
import com.ssafy.etch.job.dto.AppliedJobDTO;
import com.ssafy.etch.job.dto.AppliedJobListResponseDTO;
import com.ssafy.etch.job.entity.AppliedJobEntity;
import com.ssafy.etch.job.entity.ApplyStatusType;
import com.ssafy.etch.job.entity.JobEntity;
import com.ssafy.etch.job.repository.AppliedJobRepository;
import com.ssafy.etch.job.repository.JobRepository;
import com.ssafy.etch.member.entity.MemberEntity;
import com.ssafy.etch.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AppliedJobServiceImpl implements AppliedJobService {

    private final AppliedJobRepository appliedJobRepository;
    private final MemberRepository memberRepository;
    private final JobRepository jobRepository;

    @Override
    @Transactional
    public void createAppliedJob(Long memberId, Long jobId) {
        if (appliedJobRepository.existsByMember_IdAndJob_Id(memberId, jobId)) {
            throw new CustomException(ErrorCode.ALREADY_APPLIED);
        }

        MemberEntity member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        JobEntity job = jobRepository.findById(jobId)
                .orElseThrow(() -> new CustomException(ErrorCode.CONTENT_NOT_FOUND));

        AppliedJobEntity appliedJob = AppliedJobEntity.from(
                AppliedJobDTO.builder()
                        .job(job)
                        .member(member)
                        .status(ApplyStatusType.SCHEDULED)
                        .build()
        );

        appliedJobRepository.save(appliedJob);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppliedJobListResponseDTO> getAppliedJobList(Long memberId) {
        return appliedJobRepository.findByMember_Id(memberId).stream()
                .map(AppliedJobEntity::toAppliedJobDTO)
                .map(appliedJobDTO -> AppliedJobListResponseDTO.builder()
                        .appliedJobId(appliedJobDTO.getId())
                        .jobId(appliedJobDTO.getJob().toJobDTO().getId())
                        .companyId(appliedJobDTO.getJob().toJobDTO().getCompanyId())
                        .title(appliedJobDTO.getJob().toJobDTO().getTitle())
                        .companyName(appliedJobDTO.getJob().toJobDTO().getCompanyName())
                        .openingDate(appliedJobDTO.getJob().toJobDTO().getOpeningDate())
                        .closingDate(appliedJobDTO.getJob().toJobDTO().getExpirationDate())
                        .status(appliedJobDTO.getStatus().name())
                        .build())
                .toList();
    }

    @Override
    @Transactional
    public void updateAppliedJobStatus(Long memberId, Long appliedJobId, ApplyStatusType status) {
        AppliedJobEntity appliedJob = appliedJobRepository.findById(appliedJobId)
                .orElseThrow(() -> new CustomException(ErrorCode.CONTENT_NOT_FOUND));

        if (!appliedJob.toAppliedJobDTO().getMember().toMemberDTO().getId().equals(memberId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        appliedJob.updateStatus(status);
        appliedJobRepository.save(appliedJob);
    }

    @Override
    @Transactional
    public void deleteAppliedJob(Long memberId, Long appliedJobId) {
        AppliedJobEntity appliedJob = appliedJobRepository.findById(appliedJobId)
                .orElseThrow(() -> new CustomException(ErrorCode.CONTENT_NOT_FOUND));

        if (!appliedJob.toAppliedJobDTO().getMember().toMemberDTO().getId().equals(memberId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        appliedJobRepository.delete(appliedJob);
    }
}
