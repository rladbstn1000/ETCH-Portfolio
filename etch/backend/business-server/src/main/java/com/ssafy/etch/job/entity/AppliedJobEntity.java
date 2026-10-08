package com.ssafy.etch.job.entity;

import java.time.LocalDate;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.ssafy.etch.job.dto.AppliedJobDTO;
import com.ssafy.etch.member.entity.MemberEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "applied_job")
public class AppliedJobEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "member_id")
	private MemberEntity member;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "job_id")
	private JobEntity job;

	@Enumerated(EnumType.STRING)
	private ApplyStatusType status = ApplyStatusType.DOCUMENT_DONE;

	@Column(name = "created_at")
	@CreationTimestamp
	private LocalDate createdAt;

	@Column(name = "updated_At")
	@UpdateTimestamp
	private LocalDate updatedAt;

	public void updateStatus(ApplyStatusType status) {
		this.status = status;
	}

	public static AppliedJobEntity from(AppliedJobDTO dto) {
		AppliedJobEntity entity = new AppliedJobEntity();
		entity.id = dto.getId();
		entity.member = dto.getMember();
		entity.job = dto.getJob();
		entity.status = dto.getStatus();
		entity.createdAt = dto.getCreatedAt();
		entity.updatedAt = dto.getUpdatedAt();
		return entity;
	}

	public AppliedJobDTO toAppliedJobDTO() {
		return AppliedJobDTO.builder()
			.id(id)
			.member(member)
			.job(job)
			.status(status)
			.createdAt(createdAt)
			.updatedAt(updatedAt)
			.build();
	}
}
