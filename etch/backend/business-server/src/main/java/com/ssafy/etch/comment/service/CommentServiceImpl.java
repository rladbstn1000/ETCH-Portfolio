package com.ssafy.etch.comment.service;

import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.ssafy.etch.comment.dto.CommentDeleteResponseDTO;
import com.ssafy.etch.comment.dto.CommentListResponseDTO;
import com.ssafy.etch.comment.dto.CommentRequestDTO;
import com.ssafy.etch.comment.dto.CommentResponseDTO;
import com.ssafy.etch.comment.entity.CommentEntity;
import com.ssafy.etch.comment.repository.CommentRepository;
import com.ssafy.etch.member.entity.MemberEntity;
import com.ssafy.etch.member.repository.MemberRepository;
import com.ssafy.etch.project.entity.ProjectEntity;
import com.ssafy.etch.project.repository.ProjectRepository;
import com.ssafy.etch.project.service.ProjectAccessPolicy;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;

@Service
@Transactional
public class CommentServiceImpl implements CommentService {

	private final CommentRepository commentRepository;
	private final ProjectRepository projectRepository;
	private final MemberRepository memberRepository;

	public CommentServiceImpl(CommentRepository commentRepository, ProjectRepository projectRepository, MemberRepository memberRepository) {
		this.commentRepository = commentRepository;
		this.projectRepository = projectRepository;
		this.memberRepository = memberRepository;
	}

	@Override
	public CommentListResponseDTO getCommentsWithCountByProjectId(Long projectId, Long memberId) {
        ProjectEntity project = projectRepository.findById(projectId)
            .orElseThrow(() -> new EntityNotFoundException("프로젝트가 없습니다."));
        ProjectAccessPolicy.requireReadable(project, memberId);
		List<CommentResponseDTO> comments = commentRepository
			.findAllByProject_IdAndIsDeletedFalseOrderByCreatedAtDesc(projectId)
			.stream()
			.map(CommentEntity::toCommentDTO)
			.map(CommentResponseDTO::from)
			.toList();

		Long count = (long) comments.size();

		return new CommentListResponseDTO(count, comments);
	}

	@Override
	public CommentResponseDTO registComment(Long projectId, CommentRequestDTO commentRequestDTO, Long memberId) {
		ProjectEntity project = projectRepository.findById(projectId).orElseThrow(() -> new EntityNotFoundException("프로젝트가 없습니다."));
        ProjectAccessPolicy.requireReadable(project, memberId);
		MemberEntity member = memberRepository.findById(memberId).orElseThrow(() -> new EntityNotFoundException("회원이 없습니다."));
		CommentEntity saved = commentRepository.save(
			CommentEntity.of(commentRequestDTO.getContent(), member, project)
		);

		return CommentResponseDTO.from(saved.toCommentDTO());
	}

	@Override
	public CommentDeleteResponseDTO deleteComment(Long projectId, Long commentId, Long memberId) {

		CommentEntity comment = commentRepository.findById(commentId)
			.orElseThrow(() -> new EntityNotFoundException("댓글이 존재하지 않습니다."));

		// 해당 프로젝트에 해당 댓글이 있는지 확인
		if (!comment.getProjectId().equals(projectId)) {
			throw new IllegalArgumentException("해당 프로젝트에 해당 댓글이 없습니다.");
		}

		// 삭제된 댓글에 대한 예외 처리
		if (Boolean.TRUE.equals(comment.getIsDeleted())) {
			throw new IllegalStateException("이미 삭제된 댓글입니다.");
		}

		// 본인 댓글인지 확인
		if (!comment.getMemberId().equals(memberId)) {
			throw new AccessDeniedException("본인 댓글만 삭제할 수 있습니다.");
		}

		// soft-delete
		comment.markAsDeleted();

		return new CommentDeleteResponseDTO(comment.getId(), true);
	}
}
