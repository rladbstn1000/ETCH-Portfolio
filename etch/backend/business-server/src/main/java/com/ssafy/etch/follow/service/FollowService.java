package com.ssafy.etch.follow.service;

import com.ssafy.etch.follow.dto.FollowCountResponseDTO;
import com.ssafy.etch.member.dto.MemberResponseDTO;

import java.util.List;

public interface FollowService {
    void follow(Long followerId, Long followingId);
    void unfollow(Long followerId, Long followingId);
    List<MemberResponseDTO> getFollowerList(Long memberId);
    List<MemberResponseDTO> getFollowingList(Long memberId);
    FollowCountResponseDTO getFollowCountInfo(Long memberId);
    Boolean isFollowed(Long fromMemberId, Long toMemberId);
}

