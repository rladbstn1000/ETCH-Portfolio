package com.ssafy.etch.coverLetter.entity;

import com.ssafy.etch.coverLetter.dto.CoverLetterDTO;
import com.ssafy.etch.coverLetter.dto.CoverLetterRequestDTO;
import com.ssafy.etch.member.entity.MemberEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name="cover_letter")
@SQLRestriction("is_deleted = false")
public class CoverLetterEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Lob
    private String answer1;

    @Lob
    private String answer2;

    @Lob
    private String answer3;

    @Lob
    private String answer4;

    @Lob
    private String answer5;

    @Column(name = "is_deleted")
    private boolean isDeleted = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private MemberEntity member;

    public CoverLetterDTO toCoverLetterDTO() {
        return CoverLetterDTO.builder()
                .id(id)
                .name(name)
                .answer1(answer1)
                .answer2(answer2)
                .answer3(answer3)
                .answer4(answer4)
                .answer5(answer5)
                .isDeleted(isDeleted)
                .member(member)
                .build();
    }

    public static CoverLetterEntity from(CoverLetterDTO coverLetterDTO) {
        CoverLetterEntity coverLetterEntity = new CoverLetterEntity();
        coverLetterEntity.id = coverLetterDTO.getId();
        coverLetterEntity.name = coverLetterDTO.getName();
        coverLetterEntity.answer1 = coverLetterDTO.getAnswer1();
        coverLetterEntity.answer2 = coverLetterDTO.getAnswer2();
        coverLetterEntity.answer3 = coverLetterDTO.getAnswer3();
        coverLetterEntity.answer4 = coverLetterDTO.getAnswer4();
        coverLetterEntity.answer5 = coverLetterDTO.getAnswer5();
        coverLetterEntity.isDeleted = coverLetterDTO.isDeleted();
        coverLetterEntity.member = coverLetterDTO.getMember();
        return coverLetterEntity;
    }

    public void updateStatus() {
        this.isDeleted = true;
    }

    public void update(CoverLetterRequestDTO  coverLetterRequestDTO) {
        name = coverLetterRequestDTO.getName();
        answer1 = coverLetterRequestDTO.getAnswer1();
        answer2 = coverLetterRequestDTO.getAnswer2();
        answer3 = coverLetterRequestDTO.getAnswer3();
        answer4 = coverLetterRequestDTO.getAnswer4();
        answer5 = coverLetterRequestDTO.getAnswer5();
    }
}
