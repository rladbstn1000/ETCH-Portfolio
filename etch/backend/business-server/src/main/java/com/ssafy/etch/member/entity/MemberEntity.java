package com.ssafy.etch.member.entity;

import com.ssafy.etch.coverLetter.entity.CoverLetterEntity;
import com.ssafy.etch.follow.entity.FollowEntity;
import com.ssafy.etch.member.dto.MemberDTO;
import com.ssafy.etch.member.dto.MemberRequestDTO;
import com.ssafy.etch.portfolio.entity.PortfolioEntity;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

// Token/profile changes must not restore an unchanged stale nickname outside the indexing transaction.
@org.hibernate.annotations.DynamicUpdate
@Entity
@Table(name="member")
public class MemberEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String nickname;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(unique = true, nullable = false)
    private String phoneNumber;

    private String profile;

    @Column(nullable = false)
    private String gender;

    @Column(nullable = false)
    private LocalDate birth;

    @Enumerated(EnumType.STRING)
    private MemberRole role = MemberRole.GUEST;

    private boolean isDeleted = false;

    @Column(nullable = false, length = 1000)
    private String refreshToken;

//    @OneToMany(mappedBy = "user")
//    private List<AppliedJobEntity> appliedJobs = new ArrayList<>();
//
    @OneToMany(mappedBy = "follower")
    private List<FollowEntity> followingList = new ArrayList<>();

    @OneToMany(mappedBy = "following")
    private List<FollowEntity> followerList = new ArrayList<>();

    @OneToMany(mappedBy = "member")
    private List<CoverLetterEntity> coverLetterList = new ArrayList<>();

    @OneToMany(mappedBy = "member")
    private List<PortfolioEntity>  portfolioList = new ArrayList<>();
//    @OneToMany(mappedBy = "user")
//    private List<ProjectEntity> projects = new ArrayList<>();
//
//    @OneToMany(mappedBy = "user")
//    private List<CommentEntity> comments = new ArrayList<>();
//
//    @OneToMany(mappedBy = "user")
//    private List<LikedContentEntity> likedContents = new ArrayList<>();

    public MemberDTO toMemberDTO() {
        return MemberDTO.builder()
                .id(id)
                .nickname(nickname)
                .email(email)
                .phoneNumber(phoneNumber)
                .profile(profile)
                .gender(gender)
                .birth(String.valueOf(birth))
                .role(role.name())
                .isDeleted(isDeleted)
                .refreshToken(refreshToken)
                .build();
    }

    public static MemberEntity toMemberEntity(MemberDTO memberDTO) {
        MemberEntity memberEntity = new MemberEntity();
        if (memberDTO.getId() != null) {
            memberEntity.id = memberDTO.getId();
        }
        memberEntity.nickname = memberDTO.getNickname();
        memberEntity.email = memberDTO.getEmail();
        memberEntity.phoneNumber = memberDTO.getPhoneNumber();
        memberEntity.profile = memberDTO.getProfile();
        memberEntity.gender = memberDTO.getGender();
        memberEntity.birth = LocalDate.parse(memberDTO.getBirth());
        memberEntity.isDeleted = false;
        memberEntity.refreshToken = memberDTO.getRefreshToken();
        memberEntity.role = MemberRole.valueOf(memberDTO.getRole());
        return memberEntity;
    }

    public static void updateRefreshToken(MemberEntity memberEntity, String refreshToken) {
        memberEntity.refreshToken = refreshToken;
    }
    public static void changeMemberStatus(MemberEntity memberEntity, boolean isDeleted) {
        memberEntity.isDeleted = isDeleted;
    }
    public static void updateMemberInfo(MemberEntity memberEntity, MemberRequestDTO memberRequestDTO, String profileUrl) {
        memberEntity.nickname = memberRequestDTO.getNickname();
        memberEntity.phoneNumber = memberRequestDTO.getPhoneNumber();
        memberEntity.profile = profileUrl;
    }

    public static void updateProfileImage(MemberEntity memberEntity, String profileUrl) {
        memberEntity.profile = profileUrl;
    }

    public Long getId() {
        return id;
    }
}
