package com.ssafy.etch.coverLetter.service;

import com.ssafy.etch.coverLetter.dto.CoverLetterDTO;
import com.ssafy.etch.coverLetter.dto.CoverLetterDetailResponseDTO;
import com.ssafy.etch.coverLetter.dto.CoverLetterListResponseDTO;
import com.ssafy.etch.coverLetter.dto.CoverLetterRequestDTO;
import com.ssafy.etch.coverLetter.entity.CoverLetterEntity;
import com.ssafy.etch.coverLetter.repository.CoverLetterRepository;
import com.ssafy.etch.global.exception.CustomException;
import com.ssafy.etch.global.exception.ErrorCode;
import com.ssafy.etch.member.entity.MemberEntity;
import com.ssafy.etch.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CoverLetterServiceImpl implements CoverLetterService {

    private final CoverLetterRepository coverLetterRepository;
    private final MemberRepository memberRepository;

    @Override
    public List<CoverLetterListResponseDTO> getCoverLetterlist(Long memberId) {
        return coverLetterRepository.findAllByMemberId(memberId)
                .stream()
                .map(CoverLetterEntity::toCoverLetterDTO)
                .map(CoverLetterListResponseDTO::from)
                .toList();
    }

    @Override
    @Transactional
    public void saveCoverLetter(Long memberId, CoverLetterRequestDTO coverLetterRequestDTO) {
        MemberEntity memberEntity = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        CoverLetterDTO coverLetterDTO = coverLetterRequestDTO.toCoverLetterDTO()
                .toBuilder()
                .member(memberEntity)
                .isDeleted(false)
                .build();
        CoverLetterEntity entity = CoverLetterEntity.from(coverLetterDTO);

        coverLetterRepository.save(entity);
    }

    @Override
    @Transactional
    public void deleteCoverLetter(Long memberId, Long coverLetterId) {
        MemberEntity memberEntity = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        CoverLetterEntity coverLetterEntity = coverLetterRepository.findById(coverLetterId)
                .orElseThrow(() -> new CustomException(ErrorCode.CONTENT_NOT_FOUND));

        if(memberEntity != coverLetterEntity.toCoverLetterDTO().getMember()){
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
        coverLetterEntity.updateStatus();
    }

    @Override
    @Transactional
    public CoverLetterDetailResponseDTO updateCoverLetter(Long memberId, Long coverLetterId, CoverLetterRequestDTO coverLetterRequestDTO) {
        MemberEntity memberEntity = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        CoverLetterEntity coverLetterEntity = coverLetterRepository.findById(coverLetterId)
                .orElseThrow(() -> new CustomException(ErrorCode.CONTENT_NOT_FOUND));

        if (memberEntity != coverLetterEntity.toCoverLetterDTO().getMember()) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
        coverLetterEntity.update(coverLetterRequestDTO);

        return CoverLetterDetailResponseDTO.from(coverLetterEntity.toCoverLetterDTO());
    }

    @Override
    @Transactional(readOnly = true)
    public CoverLetterDetailResponseDTO getCoverLetterDetail(Long memberId, Long coverLetterId) {
        MemberEntity memberEntity = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        CoverLetterEntity coverLetterEntity = coverLetterRepository.findById(coverLetterId)
                .orElseThrow(() -> new CustomException(ErrorCode.CONTENT_NOT_FOUND));

        if (memberEntity != coverLetterEntity.toCoverLetterDTO().getMember()) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
        return CoverLetterDetailResponseDTO.from(coverLetterEntity.toCoverLetterDTO());
    }
}
