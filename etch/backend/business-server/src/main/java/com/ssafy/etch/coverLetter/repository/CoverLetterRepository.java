package com.ssafy.etch.coverLetter.repository;

import com.ssafy.etch.coverLetter.entity.CoverLetterEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CoverLetterRepository extends JpaRepository<CoverLetterEntity, Long> {
    List<CoverLetterEntity> findAllByMemberId (Long memberId);
}
