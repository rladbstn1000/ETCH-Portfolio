package com.ssafy.etch.search.indexing;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import com.ssafy.etch.company.repository.CompanyRepository;
import com.ssafy.etch.job.repository.JobRepository;
import com.ssafy.etch.like.dto.LikeRequestDTO;
import com.ssafy.etch.like.entity.LikeEntity;
import com.ssafy.etch.like.entity.LikeType;
import com.ssafy.etch.like.repository.LikeRepository;
import com.ssafy.etch.like.service.LikeServiceImpl;
import com.ssafy.etch.member.entity.MemberEntity;
import com.ssafy.etch.member.repository.MemberRepository;
import com.ssafy.etch.news.repository.NewsRepository;
import com.ssafy.etch.project.entity.ProjectEntity;
import com.ssafy.etch.project.event.ProjectLikeCountChangedEvent;
import com.ssafy.etch.project.repository.ProjectRepository;

class ProjectLikeLockOrderTest {
	final LikeRepository likes = mock(LikeRepository.class);
	final MemberRepository members = mock(MemberRepository.class);
	final ProjectRepository projects = mock(ProjectRepository.class);
	final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
	final LikeServiceImpl service = new LikeServiceImpl(likes, members, mock(NewsRepository.class),
		mock(CompanyRepository.class), mock(JobRepository.class), projects, events);
	final MemberEntity member = new MemberEntity();
	final ProjectEntity project = ProjectEntity.builder().title("synthetic").content("synthetic")
		.isPublic(true).member(member).build();

	@Test
	void projectLikeLocksActorBeforeProjectAndBeforeAnySnapshotReadOrInsert() {
		when(members.findLockedById(10L)).thenReturn(Optional.of(member));
		when(projects.findLockedById(12L)).thenReturn(Optional.of(project));

		service.saveLike(10L, LikeRequestDTO.builder().targetId(12L).build(), LikeType.PROJECT);

		var order = inOrder(members, projects, likes, events);
		order.verify(members).findLockedById(10L);
		order.verify(projects).findLockedById(12L);
		order.verify(likes).existsByMember_IdAndTargetIdAndType(10L, 12L, LikeType.PROJECT);
		order.verify(likes).save(any());
		order.verify(events).publishEvent(ProjectLikeCountChangedEvent.of(12L));
		verify(members, never()).findById(Long.valueOf(10));
	}

	@Test
	void nonProjectLikesKeepTheirExistingOrdinaryMemberLookup() {
		when(members.findById(Long.valueOf(10))).thenReturn(Optional.of(member));

		service.saveLike(10L, LikeRequestDTO.builder().targetId(12L).build(), LikeType.NEWS);

		verify(members).findById(Long.valueOf(10));
		verify(members, never()).findLockedById(any());
		verifyNoInteractions(projects, events);
		verify(likes).save(any());
	}

	@Test
	void cancellationDoesNotAcquireMemberFkLockOrInsertANewLike() {
		LikeEntity like = new LikeEntity();
		when(projects.findLockedById(12L)).thenReturn(Optional.of(project));
		when(likes.findByMember_IdAndTargetIdAndType(10L, 12L, LikeType.PROJECT))
			.thenReturn(Optional.of(like));

		service.deleteLike(10L, 12L, LikeType.PROJECT);

		var order = inOrder(projects, likes, events);
		order.verify(projects).findLockedById(12L);
		order.verify(likes).findByMember_IdAndTargetIdAndType(10L, 12L, LikeType.PROJECT);
		order.verify(likes).delete(like);
		order.verify(events).publishEvent(ProjectLikeCountChangedEvent.of(12L));
		verify(likes, never()).save(any());
		verifyNoInteractions(members);
	}
}
