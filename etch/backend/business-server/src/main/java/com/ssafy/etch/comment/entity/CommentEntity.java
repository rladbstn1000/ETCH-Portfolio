package com.ssafy.etch.comment.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.ssafy.etch.comment.dto.CommentDTO;
import com.ssafy.etch.member.entity.MemberEntity;
import com.ssafy.etch.project.entity.ProjectEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "project_comment")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CommentEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(columnDefinition = "TEXT")
	private String content;

	@CreationTimestamp
	@Column(name = "created_at")
	private LocalDateTime createdAt;

	@Column(name = "is_deleted", nullable = false)
	private Boolean isDeleted;

	@ManyToOne
	@JoinColumn(name = "member_id")
	private MemberEntity member;

	@ManyToOne
	@JoinColumn(name = "project_post")
	private ProjectEntity project;

	// soft-delete: setter 대신 우회
	public void markAsDeleted() {
		this.isDeleted = true;
	}

	// 삭제여부 검증하기 위한 getter
	public Long getMemberId() {
		return this.member.toMemberDTO().getId();
	}

	public Long getProjectId() {
		return this.project.toProjectDTO().getId();
	}

	public static CommentEntity of(String content, MemberEntity member, ProjectEntity project) {

		CommentEntity commentEntity = new CommentEntity();

		commentEntity.content = content;
		commentEntity.createdAt = LocalDateTime.now();
		commentEntity.isDeleted = false;
		commentEntity.member = member;
		commentEntity.project = project;

		return commentEntity;
	}

	public CommentDTO toCommentDTO() {
		return CommentDTO.builder()
			.id(id)
			.content(content)
			.createdAt(createdAt)
			.isDeleted(isDeleted)
			.member(member)
			.project(project)
			.build();
	}
}
