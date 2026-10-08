package com.ssafy.etch.follow.entity;

import com.ssafy.etch.follow.dto.FollowDTO;
import com.ssafy.etch.member.entity.MemberEntity;
import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "follow")
public class FollowEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follower_id", nullable = false)
    private MemberEntity follower;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "following_id", nullable = false)
    private MemberEntity following;

    public FollowDTO toFollowDTO() {
        return FollowDTO.builder()
                .follower(follower.toMemberDTO())
                .following(following.toMemberDTO())
                .build();
    }

    public static FollowEntity of(MemberEntity follower, MemberEntity following) {
        FollowEntity followEntity = new FollowEntity();
        followEntity.follower = follower;
        followEntity.following = following;
        return followEntity;
    }
}