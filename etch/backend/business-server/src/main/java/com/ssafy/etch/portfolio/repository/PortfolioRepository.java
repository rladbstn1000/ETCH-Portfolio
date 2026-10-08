package com.ssafy.etch.portfolio.repository;

import com.ssafy.etch.portfolio.entity.PortfolioEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PortfolioRepository extends JpaRepository<PortfolioEntity, Long> {
    Optional<PortfolioEntity> findById(Long portfolioId);
    List<PortfolioEntity> findAllByMember_IdAndIsDeletedIsFalse(Long memberId);
}
