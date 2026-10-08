package com.ssafy.etch.like.service;

import java.util.List;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import com.ssafy.etch.company.dto.CompanyLikeResponseDTO;
import com.ssafy.etch.company.entity.CompanyEntity;
import com.ssafy.etch.company.repository.CompanyRepository;
import com.ssafy.etch.global.exception.CustomException;
import com.ssafy.etch.global.exception.ErrorCode;
import com.ssafy.etch.job.dto.JobLikeResponseDTO;
import com.ssafy.etch.job.entity.JobEntity;
import com.ssafy.etch.job.repository.JobRepository;
import com.ssafy.etch.like.dto.LikeDTO;
import com.ssafy.etch.like.dto.LikeRequestDTO;
import com.ssafy.etch.like.entity.LikeEntity;
import com.ssafy.etch.like.entity.LikeType;
import com.ssafy.etch.like.repository.LikeRepository;
import com.ssafy.etch.member.entity.MemberEntity;
import com.ssafy.etch.member.repository.MemberRepository;
import com.ssafy.etch.news.dto.NewsLikeResponseDTO;
import com.ssafy.etch.news.entity.NewsEntity;
import com.ssafy.etch.news.repository.NewsRepository;
import com.ssafy.etch.project.dto.ProjectLikeResponseDTO;
import com.ssafy.etch.project.entity.ProjectEntity;
import com.ssafy.etch.project.event.ProjectLikeCountChangedEvent;
import com.ssafy.etch.project.repository.ProjectRepository;
import com.ssafy.etch.project.service.ProjectAccessPolicy;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LikeServiceImpl implements LikeService {

	private final LikeRepository likeRepository;
	private final MemberRepository memberRepository;
	private final NewsRepository newsRepository;
	private final CompanyRepository companyRepository;
	private final JobRepository jobRepository;
	private final ProjectRepository projectRepository;
	private final ApplicationEventPublisher eventPublisher;

	@Override
	@Transactional
	public void saveLike(Long memberId, LikeRequestDTO likeRequestDTO, LikeType likeType) {
		Long targetId = likeRequestDTO.getTargetId();
		if (targetId == null) {
			throw new CustomException(ErrorCode.INVALID_INPUT);
		}

		// A project like INSERT checks the member FK. Take that member lock first,
		// matching nickname fanout's member -> project order and avoiding inversion.
		MemberEntity lockedMember = likeType == LikeType.PROJECT
			? memberRepository.findLockedById(memberId)
				.orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND))
			: null;
		lockProjectIfNeeded(targetId, memberId, likeType);

		// 이미 좋아요한 경우 중복 방지 (선택)
		boolean exists = likeRepository.existsByMember_IdAndTargetIdAndType(memberId, targetId, likeType);
		if (exists) {
			throw new CustomException(ErrorCode.ALREADY_LIKED);
		}

		LikeDTO likeDTO = LikeDTO.builder()
			.memberId(memberId)
			.targetId(targetId)
			.type(likeType)
			.build();
		MemberEntity memberEntity = lockedMember != null ? lockedMember
			: memberRepository.findById(memberId)
				.orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
		LikeEntity likeEntity = LikeEntity.from(likeDTO, memberEntity);

		likeRepository.save(likeEntity);

		if (likeType.equals(LikeType.PROJECT)) {
			eventPublisher.publishEvent(ProjectLikeCountChangedEvent.of(targetId));
		}
	}

	@Override
	@Transactional
	public void deleteLike(Long memberId, Long targetId, LikeType likeType) {
		if (targetId == null) {
			throw new CustomException(ErrorCode.INVALID_INPUT);
		}

		lockProjectIfNeeded(targetId, memberId, likeType);

		// 존재하는 좋아요 엔티티 조회
		LikeEntity likeEntity = likeRepository.findByMember_IdAndTargetIdAndType(memberId, targetId, likeType)
			.orElseThrow(() -> new CustomException(ErrorCode.LIKE_NOT_FOUND));

		likeRepository.delete(likeEntity);

		if (likeType.equals(LikeType.PROJECT)) {
			eventPublisher.publishEvent(ProjectLikeCountChangedEvent.of(targetId));
		}
	}

	@Override
	public List<NewsLikeResponseDTO> getLikedNews(Long memberId) {
		List<Long> targetIds = getLikedTargetIds(memberId, LikeType.NEWS);
		return newsRepository.findAllByIdIn(targetIds)
			.stream()
			.map(NewsEntity::toNewsDTO)
			.map(NewsLikeResponseDTO::from)
			.toList();
	}

	@Override
	public List<CompanyLikeResponseDTO> getLikedCompany(Long memberId) {
		List<Long> targetIds = getLikedTargetIds(memberId, LikeType.COMPANY);
		return companyRepository.findAllByIdIn(targetIds)
			.stream()
			.map(CompanyEntity::toCompanyDTO)
			.map(CompanyLikeResponseDTO::from)
			.toList();
	}

	@Override
	public List<JobLikeResponseDTO> getLikedJob(Long memberId) {
		List<Long> targetIds = getLikedTargetIds(memberId, LikeType.JOB);
		return jobRepository.findAllByIdIn(targetIds)
			.stream()
			.map(JobEntity::toJobDTO)
			.map(JobLikeResponseDTO::from)
			.toList();
	}

	@Override
	public List<ProjectLikeResponseDTO> getLikedProject(Long memberId) {
		List<Long> targetIds = getLikedTargetIds(memberId, LikeType.PROJECT);
		return projectRepository.findAllByIdIn(targetIds)
			.stream()
			.map(ProjectEntity::toProjectDTO)
			.map(ProjectLikeResponseDTO::from)
			.toList();
	}

    private void lockProjectIfNeeded(Long projectId, Long memberId, LikeType type) {
        if (type == LikeType.PROJECT) {
            ProjectEntity project = projectRepository.findLockedById(projectId)
                .orElseThrow(() -> new CustomException(ErrorCode.CONTENT_NOT_FOUND));
            ProjectAccessPolicy.requireReadable(project, memberId);
        }
    }

	private List<Long> getLikedTargetIds(Long memberId, LikeType likeType) {
		List<Long> targetIds = likeRepository.findByMemberIdAndType(memberId, likeType)
			.stream()
			.map(LikeEntity::toDTO)
			.map(LikeDTO::getTargetId)
			.toList();

		if (targetIds.isEmpty()) {
			throw new CustomException(ErrorCode.LIKE_NOT_FOUND);
		}

		return targetIds;
	}
}
