package com.ssafy.etch.follow.repository;

import com.ssafy.etch.follow.entity.FollowEntity;
import com.ssafy.etch.member.entity.MemberEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FollowRepository extends JpaRepository<FollowEntity, Long> {
    boolean existsByFollowerAndFollowing(MemberEntity follower, MemberEntity following);
    void deleteByFollowerAndFollowing(MemberEntity follower, MemberEntity following);
    List<FollowEntity> findByFollowing(MemberEntity following);
    List<FollowEntity> findByFollower(MemberEntity follower);
    long countByFollowing(MemberEntity member);
    long countByFollower(MemberEntity member);
}