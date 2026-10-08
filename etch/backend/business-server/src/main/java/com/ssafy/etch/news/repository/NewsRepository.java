package com.ssafy.etch.news.repository;

import com.ssafy.etch.news.entity.NewsEntity;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface NewsRepository extends JpaRepository<NewsEntity, Long> {
    List<NewsEntity> findAllByIdIn(Collection<Long> id);
    Page<NewsEntity> findAllByOrderByPublishedAtDesc(Pageable pageable);
    Page<NewsEntity> findAllByCompanyIdOrderByPublishedAtDesc(Long companyId, Pageable pageable);
}
