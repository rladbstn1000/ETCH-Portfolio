package com.ssafy.etch.tech.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ssafy.etch.tech.entity.TechCodeEntity;

public interface TechCodeRepository extends JpaRepository<TechCodeEntity, Long> {
}
