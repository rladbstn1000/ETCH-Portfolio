package com.ssafy.etch.search.repository;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import com.ssafy.etch.search.document.NewsDocument;

public interface NewsDocumentRepository extends ElasticsearchRepository<NewsDocument, Long> {
}
