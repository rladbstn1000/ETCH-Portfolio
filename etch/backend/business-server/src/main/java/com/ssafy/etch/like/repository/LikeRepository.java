package com.ssafy.etch.like.repository;

import com.ssafy.etch.like.entity.LikeEntity;
import com.ssafy.etch.like.entity.LikeType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LikeRepository extends JpaRepository<LikeEntity, Long> {
    boolean existsByMember_IdAndTargetIdAndType(Long memberId, Long targetId, LikeType type);
    Optional<LikeEntity> findByMember_IdAndTargetIdAndType(Long memberId, Long targetId, LikeType type);
    List<LikeEntity> findByMemberIdAndType(Long memberId, LikeType type);
    Long countByTargetIdAndType(Long targetId, LikeType type);
}