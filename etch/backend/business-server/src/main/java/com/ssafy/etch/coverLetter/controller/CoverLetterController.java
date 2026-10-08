package com.ssafy.etch.coverLetter.controller;

import com.ssafy.etch.coverLetter.dto.CoverLetterDetailResponseDTO;
import com.ssafy.etch.coverLetter.dto.CoverLetterListResponseDTO;
import com.ssafy.etch.coverLetter.dto.CoverLetterRequestDTO;
import com.ssafy.etch.coverLetter.service.CoverLetterService;
import com.ssafy.etch.global.response.ApiResponse;
import com.ssafy.etch.oauth.dto.CustomOAuth2User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/coverletters")
public class CoverLetterController {

    private final CoverLetterService coverLetterService;

    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<CoverLetterListResponseDTO>>> list(
            @AuthenticationPrincipal CustomOAuth2User oAuth2User) {

        List<CoverLetterListResponseDTO> list = coverLetterService.getCoverLetterlist(oAuth2User.getId());

        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(list,null));
    }
    
    @PostMapping
    public ResponseEntity<ApiResponse<CoverLetterListResponseDTO>> create(
            @AuthenticationPrincipal CustomOAuth2User oAuth2User,
            @RequestBody CoverLetterRequestDTO coverLetterRequestDTO
            ) {

        coverLetterService.saveCoverLetter(oAuth2User.getId(), coverLetterRequestDTO);


        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(null,"자기소개서 등록 성공"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<CoverLetterListResponseDTO>> delete(
            @AuthenticationPrincipal CustomOAuth2User oAuth2User,
            @PathVariable Long id) {

        coverLetterService.deleteCoverLetter(oAuth2User.getId(), id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(ApiResponse.success(null,"자기소개서 삭제 성공"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CoverLetterDetailResponseDTO>> update(
            @AuthenticationPrincipal CustomOAuth2User oAuth2User,
            @PathVariable Long id,
            @RequestBody CoverLetterRequestDTO coverLetterRequestDTO) {
        CoverLetterDetailResponseDTO responseDTO = coverLetterService.updateCoverLetter(oAuth2User.getId(), id, coverLetterRequestDTO);
        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(responseDTO,"자기소개서 수정 성공"));
    }

    @GetMapping("/{coverLetterId}")
    public ResponseEntity<ApiResponse<CoverLetterDetailResponseDTO>> getCoverLetter(
            @AuthenticationPrincipal CustomOAuth2User oAuth2User
            , @PathVariable Long coverLetterId) {

        CoverLetterDetailResponseDTO responseDTO = coverLetterService.getCoverLetterDetail(oAuth2User.getId(), coverLetterId);

        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(responseDTO, "자기소개서 상세조회"));
    }
}
