package com.ssafy.etch.coverLetter.service;

import com.ssafy.etch.coverLetter.dto.CoverLetterDetailResponseDTO;
import com.ssafy.etch.coverLetter.dto.CoverLetterListResponseDTO;
import com.ssafy.etch.coverLetter.dto.CoverLetterRequestDTO;

import java.util.List;

public interface CoverLetterService {
    List<CoverLetterListResponseDTO> getCoverLetterlist(Long memberId);
    void saveCoverLetter(Long memberId, CoverLetterRequestDTO coverLetterRequestDTO);
    void deleteCoverLetter(Long memberId, Long coverLetterId);
    CoverLetterDetailResponseDTO updateCoverLetter(Long memberId, Long coverLetterId, CoverLetterRequestDTO coverLetterRequestDTO);
    CoverLetterDetailResponseDTO getCoverLetterDetail(Long memberId, Long coverLetterId);
}
