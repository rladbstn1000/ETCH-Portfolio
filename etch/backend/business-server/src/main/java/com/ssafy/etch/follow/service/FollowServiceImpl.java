package com.ssafy.etch.follow.service;

import com.ssafy.etch.follow.dto.FollowCountResponseDTO;
import com.ssafy.etch.follow.dto.FollowDTO;
import com.ssafy.etch.follow.entity.FollowEntity;
import com.ssafy.etch.follow.repository.FollowRepository;
import com.ssafy.etch.global.exception.CustomException;
import com.ssafy.etch.global.exception.ErrorCode;
import com.ssafy.etch.member.dto.MemberResponseDTO;
import com.ssafy.etch.member.entity.MemberEntity;
import com.ssafy.etch.member.repository.MemberRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FollowServiceImpl implements FollowService {

    private final MemberRepository memberRepository;
    private final FollowRepository followRepository;

    @Override
    @Transactional
    public void follow(Long followerId, Long followingId) {
        if (followerId.equals(followingId)) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }

        MemberEntity follower = memberRepository.findById(followerId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        MemberEntity following = memberRepository.findById(followingId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        boolean alreadyFollowing = followRepository.existsByFollowerAndFollowing(follower, following);
        if (alreadyFollowing) {
            throw new CustomException(ErrorCode.INVALID_INPUT); // 이미 팔로우 중
        }
        followRepository.save(FollowEntity.of(follower, following));
    }

    @Override
    @Transactional
    public void unfollow(Long followerId, Long followingId) {
        MemberEntity follower = memberRepository.findById(followerId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        MemberEntity following = memberRepository.findById(followingId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        followRepository.deleteByFollowerAndFollowing(follower, following);
    }

    @Override
    public List<MemberResponseDTO> getFollowerList(Long memberId) {
        MemberEntity member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        return followRepository.findByFollowing(member).stream()
                .map(FollowEntity::toFollowDTO)
                .map(FollowDTO::getFollower)
                .map(MemberResponseDTO::from)
                .collect(Collectors.toList());
    }

    @Override
    public List<MemberResponseDTO> getFollowingList(Long memberId) {
        MemberEntity member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        return followRepository.findByFollower(member).stream()
                .map(FollowEntity::toFollowDTO)
                .map(FollowDTO::getFollowing)
                .map(MemberResponseDTO::from)
                .collect(Collectors.toList());
    }

    @Override
    public FollowCountResponseDTO getFollowCountInfo(Long memberId) {
        MemberEntity member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        long followerCnt = followRepository.countByFollowing(member);
        long followingCnt = followRepository.countByFollower(member);

        return FollowCountResponseDTO.builder()
                .followerCount(followerCnt)
                .followingCount(followingCnt)
                .build();
    }

    @Override
    public Boolean isFollowed(Long fromMemberId, Long toMemberId) {
        MemberEntity fromMember = memberRepository.findById(fromMemberId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        MemberEntity toMember = memberRepository.findById(toMemberId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        return followRepository.existsByFollowerAndFollowing(fromMember, toMember);
    }
}