package com.ssafy.etch.tech.entity;

import jakarta.persistence.*;
import lombok.Getter;

@Entity
@Table(name = "tech_code")
@Getter
public class TechCodeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tech_category", nullable = false)
    private String techCategory;

    @Column(name = "code_name", unique = true, nullable = false)
    private String codeName;
}
