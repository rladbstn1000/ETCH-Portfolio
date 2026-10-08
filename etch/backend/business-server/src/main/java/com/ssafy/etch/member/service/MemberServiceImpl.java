package com.ssafy.etch.member.service;

import com.ssafy.etch.global.exception.CustomException;
import com.ssafy.etch.global.exception.ErrorCode;
import com.ssafy.etch.global.service.S3Service;
import com.ssafy.etch.global.util.FileUtil;
import com.ssafy.etch.member.dto.MemberDTO;
import com.ssafy.etch.member.dto.MemberRequestDTO;
import com.ssafy.etch.member.entity.MemberEntity;
import com.ssafy.etch.member.repository.MemberRepository;
import com.ssafy.etch.oauth.jwt.util.JWTUtil;
import com.ssafy.etch.project.dto.ProjectListDTO;
import com.ssafy.etch.project.entity.ProjectEntity;
import com.ssafy.etch.project.repository.ProjectRepository;
import com.ssafy.etch.project.event.ProjectChangedEvent;
import org.springframework.context.ApplicationEventPublisher;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository;
    private final ProjectRepository projectRepository;
    private final JWTUtil jwtUtil;
    private final S3Service s3Service;
    private final ApplicationEventPublisher events;

    @Override
    public MemberDTO findById(long id) {
        MemberEntity memberEntity = memberRepository.findById(id)
                .orElseThrow(()-> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (memberEntity.toMemberDTO().isDeleted()) {
            throw new CustomException(ErrorCode.USER_WITHDRAWN);
        }

        return memberEntity.toMemberDTO();
    }

    @Override
    @Transactional
    public MemberDTO registerNewMember(String email, MemberRequestDTO requestDTO, MultipartFile profile) {
        String profileUrl = null;
        if (profile != null && !profile.isEmpty()) {
            if (!FileUtil.isImageOk(profile)) {
                throw new CustomException(ErrorCode.INVALID_FILE_EXTENSION);
            }
            profileUrl = s3Service.uploadFile(profile);
        }

        MemberDTO memberDTO = MemberDTO.builder()
                .nickname(requestDTO.getNickname())
                .gender(requestDTO.getGender())
                .phoneNumber(requestDTO.getPhoneNumber())
                .birth(requestDTO.getBirth())
                .email(email)
                .profile(profileUrl)
                .role("USER")
                .refreshToken("") // 초기값 설정
                .build();

        MemberEntity memberEntity = MemberEntity.toMemberEntity(memberDTO);
        MemberEntity savedEntity = memberRepository.save(memberEntity);

        String refreshToken = jwtUtil.createJwt(
                "refresh",
                savedEntity.toMemberDTO().getEmail(),
                savedEntity.toMemberDTO().getRole(),
                savedEntity.toMemberDTO().getId(),
                24 * 60 * 60 * 1000L // 1일
        );
        MemberEntity.updateRefreshToken(savedEntity, refreshToken);

        return savedEntity.toMemberDTO();
    }
    @Override
    @Transactional
    public void updateRefreshToken(Long id, String refreshToken) {
        MemberEntity memberEntity = memberRepository.findById(id)
                .orElseThrow(()-> new CustomException(ErrorCode.USER_NOT_FOUND));

        MemberEntity.updateRefreshToken(memberEntity, refreshToken);
    }

    @Override
    @Transactional
    public void deleteMember(Long id) {
        MemberEntity memberEntity = memberRepository.findById(id)
                .orElseThrow(()-> new CustomException(ErrorCode.USER_NOT_FOUND));

        MemberEntity.changeMemberStatus(memberEntity, true);
    }

    @Override
    @Transactional
    public MemberDTO updateMember(Long id, MemberRequestDTO memberRequestDTO, MultipartFile profile) {
        // Lock before the first consistent read; project creation takes this member lock as well.
        MemberEntity memberEntity = memberRepository.findLockedById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        String profileUrl = memberEntity.toMemberDTO().getProfile();

        if (profile != null && !profile.isEmpty()) {
            if (!FileUtil.isImageOk(profile)) {
                throw new CustomException(ErrorCode.INVALID_FILE_EXTENSION);
            }
            if (profileUrl != null && !profileUrl.isEmpty()) {
                s3Service.deleteFileByUrl(profileUrl);
            }
            profileUrl = s3Service.uploadFile(profile);
        }

        // memberName is part of the project search document. Serialize and revise those documents too.
        var projects = projectRepository.findAllByMemberId(id).stream()
            .map(ProjectEntity::getId).sorted().toList();
        projects.forEach(projectRepository::findLockedById);
        MemberEntity.updateMemberInfo(memberEntity, memberRequestDTO, profileUrl);
        projects.forEach(projectId -> events.publishEvent(
            new ProjectChangedEvent(projectId, ProjectChangedEvent.ChangeType.UPSERT)));

        return memberEntity.toMemberDTO();
    }

    @Override
    public List<ProjectListDTO> findAllProjectByMemberId(Long memberId) {
        return projectRepository.findAllByMemberId(memberId)
                .stream()
                .map(ProjectEntity::toProjectDTO)
                .map(ProjectListDTO::from)
                .toList();
    }

    @Override
    @Transactional
    public String updateProfileImage(Long id, MultipartFile profile) {
        MemberEntity memberEntity = memberRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        String profileUrl = memberEntity.toMemberDTO().getProfile();

        if (profile != null && !profile.isEmpty()) {
            if (!FileUtil.isImageOk(profile)) {
                throw new CustomException(ErrorCode.INVALID_FILE_EXTENSION);
            }
            if (profileUrl != null && !profileUrl.isEmpty()) {
                s3Service.deleteFileByUrl(profileUrl);
            }
            profileUrl = s3Service.uploadFile(profile);
        } else {
            if (profileUrl != null && !profileUrl.isEmpty()) {
                s3Service.deleteFileByUrl(profileUrl);
                profileUrl = null;
            }
        }

        MemberEntity.updateProfileImage(memberEntity, profileUrl);

        return profileUrl;
    }
}
