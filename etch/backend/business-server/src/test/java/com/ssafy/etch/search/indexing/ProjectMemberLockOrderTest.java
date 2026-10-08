package com.ssafy.etch.search.indexing;

import com.ssafy.etch.file.repository.FileRepository;
import com.ssafy.etch.global.service.S3Service;
import com.ssafy.etch.like.repository.LikeRepository;
import com.ssafy.etch.member.dto.MemberDTO;
import com.ssafy.etch.member.dto.MemberRequestDTO;
import com.ssafy.etch.member.entity.MemberEntity;
import com.ssafy.etch.member.repository.MemberRepository;
import com.ssafy.etch.member.service.MemberServiceImpl;
import com.ssafy.etch.oauth.jwt.util.JWTUtil;
import com.ssafy.etch.project.dto.ProjectCreateRequestDTO;
import com.ssafy.etch.project.entity.ProjectCategory;
import com.ssafy.etch.project.entity.ProjectEntity;
import com.ssafy.etch.project.event.ProjectChangedEvent;
import com.ssafy.etch.project.repository.ProjectRepository;
import com.ssafy.etch.project.repository.ProjectTechRepository;
import com.ssafy.etch.project.service.ProjectServiceImpl;
import com.ssafy.etch.tech.repository.TechCodeRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/** Lock-order contracts; actual transaction/commit semantics are exercised against local MySQL. */
class ProjectMemberLockOrderTest {
    final MemberRepository members = mock(MemberRepository.class);
    final ProjectRepository projects = mock(ProjectRepository.class);
    final S3Service storage = mock(S3Service.class);
    final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    final MemberEntity member = MemberEntity.toMemberEntity(MemberDTO.builder().id(10L)
        .nickname("original").email("synthetic@example.invalid").birth("2000-01-01").role("USER").build());

    @Test void creationLocksMemberBeforeInsertingProjectAndEnqueueing() {
        when(members.findLockedById(10L)).thenReturn(Optional.of(member));
        when(projects.save(any())).thenAnswer(invocation -> {
            ProjectEntity project = invocation.getArgument(0);
            ReflectionTestUtils.setField(project, "id", 12L);
            return project;
        });
        var service = new ProjectServiceImpl(projects, mock(LikeRepository.class), members,
            mock(TechCodeRepository.class), mock(ProjectTechRepository.class), mock(FileRepository.class), storage, events);
        service.createProject(10L, ProjectCreateRequestDTO.builder().title("synthetic").content("synthetic")
            .isPublic(true).projectCategory(ProjectCategory.values()[0]).techCodeIds(List.of()).build(), null, List.of());
        var order = inOrder(members, projects, events);
        order.verify(members).findLockedById(10L);
        order.verify(projects).save(any());
        order.verify(events).publishEvent(new ProjectChangedEvent(12L, ProjectChangedEvent.ChangeType.UPSERT));
        verify(members, never()).getReferenceById(any());
    }

    @Test void nicknameLocksMemberBeforeSnapshotAndProjectsInAscendingOrder() {
        when(members.findLockedById(10L)).thenReturn(Optional.of(member));
        ProjectEntity later = project(12L);
        ProjectEntity earlier = project(11L);
        when(projects.findAllByMemberId(10L)).thenReturn(List.of(later, earlier));
        var service = new MemberServiceImpl(members, projects, mock(JWTUtil.class), storage, events);
        service.updateMember(10L, MemberRequestDTO.builder().nickname("changed").build(), null);
        var order = inOrder(members, projects, events);
        order.verify(members).findLockedById(10L);
        order.verify(projects).findAllByMemberId(10L);
        order.verify(projects).findLockedById(11L);
        order.verify(projects).findLockedById(12L);
        order.verify(events).publishEvent(new ProjectChangedEvent(11L, ProjectChangedEvent.ChangeType.UPSERT));
        order.verify(events).publishEvent(new ProjectChangedEvent(12L, ProjectChangedEvent.ChangeType.UPSERT));
        assertThat(member.toMemberDTO().getNickname()).isEqualTo("changed");
    }

    private ProjectEntity project(long id) {
        ProjectEntity project = ProjectEntity.builder().title("synthetic").content("synthetic")
            .isPublic(true).member(member).build();
        ReflectionTestUtils.setField(project, "id", id);
        return project;
    }
}
