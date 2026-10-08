package com.ssafy.etch.portfolio.service;

import com.ssafy.etch.portfolio.dto.PortfolioDetailResponseDTO;
import com.ssafy.etch.portfolio.dto.PortfolioListResponseDTO;
import com.ssafy.etch.portfolio.dto.PortfolioRequestDTO;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface PortfolioService {
    List<PortfolioListResponseDTO> getPortfolioList(Long memberId);
    void savePortfolio(Long memberId, PortfolioRequestDTO portfolioRequestDTO);
    void updatePortfolio(Long memberId, Long portfolioId, PortfolioRequestDTO portfolioRequestDTO);
    void deletePortfolio(Long memberId, Long portfolioId);
    PortfolioDetailResponseDTO getPortfolioDetail(Long memberId, Long portfolioId);
    String getPortfolioAsMarkdown(Long memberId, Long portfolioId);
}
