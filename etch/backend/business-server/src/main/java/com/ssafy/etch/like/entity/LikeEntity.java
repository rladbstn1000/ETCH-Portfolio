package com.ssafy.etch.like.entity;

import com.ssafy.etch.like.dto.LikeDTO;
import com.ssafy.etch.member.entity.MemberEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "liked_content")
public class LikeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private MemberEntity member;

    @Column(nullable = false)
    private Long targetId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LikeType type;

    public static LikeEntity from(LikeDTO likeDTO, MemberEntity memberEntity) {
        LikeEntity likeEntity = new LikeEntity();
        likeEntity.targetId = likeDTO.getTargetId();
        likeEntity.type = likeDTO.getType();
        likeEntity.member = memberEntity;
        return likeEntity;
    }

    public LikeDTO toDTO() {
        return LikeDTO.builder()
                .id(id)
                .memberId(member.toMemberDTO().getId())
                .targetId(targetId)
                .type(type)
                .build();
    }
}