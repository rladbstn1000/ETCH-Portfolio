package com.ssafy.etch.news.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.ssafy.etch.company.entity.CompanyEntity;

import com.ssafy.etch.news.dto.NewsDTO;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;

@Entity
@Table(name="news")
@Getter
public class NewsEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "thumbnail_url", length = 1024)
	private String thumbnailUrl;

	@Column(nullable = false)
	private String title;

	@Column(columnDefinition = "TEXT")
	private String description;

	@Column(length = 1024, nullable = false)
	private String url;

	@Column(name = "company_name")
	private String companyName;

	@Column(name = "published_at")
	private LocalDateTime publishedAt;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "company_id", nullable = false)
	private CompanyEntity company;

	public NewsDTO toNewsDTO() {
		return NewsDTO.builder()
				.id(id)
				.thumbnailUrl(thumbnailUrl)
				.title(title)
				.description(description)
				.url(url)
				.publishedAt(publishedAt)
				.company(company)
				.build();
	}
}