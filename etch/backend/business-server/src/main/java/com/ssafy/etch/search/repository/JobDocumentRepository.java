package com.ssafy.etch.search.repository;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import com.ssafy.etch.search.document.JobDocument;

public interface JobDocumentRepository extends ElasticsearchRepository<JobDocument, Long> {
}
