package com.ssafy.etch.global.response;

import java.util.List;

import org.springframework.data.domain.Page;

import lombok.Getter;

@Getter
public class PageResponseDTO<T> {
	private final List<T> content;      // 현재 페이지 데이터 목록
	private final int totalPages;       // 전체 페이지 수
	private final long totalElements;   // 전체 데이터 개수
	private final int currentPage;      // 현재 페이지 번호 (1부터 시작)
	private final boolean isLast;       // 마지막 페이지 여부

	public PageResponseDTO(Page<T> page) {
		this.content = page.getContent();
		this.totalPages = page.getTotalPages();
		this.totalElements = page.getTotalElements();
		this.currentPage = page.getNumber() + 1; // 1부터 시작
		this.isLast = page.isLast();
	}
}
