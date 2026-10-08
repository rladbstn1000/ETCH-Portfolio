package com.ssafy.etch.portfolio.repository;

import com.ssafy.etch.portfolio.entity.PortfolioProjectEntity;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface PortfolioProjectRepository extends JpaRepository<PortfolioProjectEntity,Long> {
    @Modifying
    @Query("DELETE FROM PortfolioProjectEntity p WHERE p.portfolio.id = :portfolioId")
    void deleteByPortfolioId(@Param("portfolioId") Long portfolioId);
}
