package com.ssafy.etch.member.service;

import com.ssafy.etch.member.dto.MemberDTO;
import com.ssafy.etch.member.dto.MemberRequestDTO;
import com.ssafy.etch.project.dto.ProjectListDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface MemberService {
    MemberDTO findById(long id);

    MemberDTO registerNewMember(String email, MemberRequestDTO requestDTO, MultipartFile profile);

    void updateRefreshToken(Long id, String refreshToken);

    void deleteMember(Long id);

    MemberDTO updateMember(Long id, MemberRequestDTO memberRequestDTO, MultipartFile profile);

    List<ProjectListDTO> findAllProjectByMemberId(Long memberId);

    String updateProfileImage(Long id, MultipartFile profile);
}
