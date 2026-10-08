package com.ssafy.etch.search.repository;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import com.ssafy.etch.search.document.ProjectDocument;

public interface ProjectDocumentRepository extends ElasticsearchRepository<ProjectDocument, Long> {
}
