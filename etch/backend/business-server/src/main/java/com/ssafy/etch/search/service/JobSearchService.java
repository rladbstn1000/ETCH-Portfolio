package com.ssafy.etch.search.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHitSupport;
import org.springframework.stereotype.Service;

import com.ssafy.etch.search.document.JobDocument;
import com.ssafy.etch.search.dto.JobSearchResponseDTO;

import co.elastic.clients.elasticsearch._types.FieldValue;
import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class JobSearchService {

	private final ElasticsearchOperations elasticsearchOperations;

	public Page<JobSearchResponseDTO> searchWithFilters(
		String keyword,
		List<String> regions,
		List<String> jobCategories,
		String workType,
		String educationLevel,
		int page,
		int size
	) {
		Query searchQuery = buildQuery(keyword, regions, jobCategories, workType, educationLevel);

		if (searchQuery == null) {
			return Page.empty();
		}

		Pageable pageable = PageRequest.of(page, size);

		NativeQuery query = NativeQuery.builder()
			.withQuery(searchQuery)
			.withPageable(pageable)
			.withTrackTotalHits(true) // 전체 개수 추적
			.build();

		var hits = elasticsearchOperations.search(query, JobDocument.class);

		// ES 결과 -> Page<JobSearchResponseDTO>
		return SearchHitSupport.searchPageFor(hits, pageable)
			.map(SearchHit::getContent)                  // JobDocument
			.map(JobSearchResponseDTO::from);            // DTO 변환
	}

	static Query buildQuery(String keyword, List<String> regions, List<String> jobCategories,
		String workType, String educationLevel) {
		boolean hasKeyword = keyword != null && !keyword.isBlank();
		boolean hasWorkType = workType != null && !workType.isBlank();
		boolean hasEducation = educationLevel != null && !educationLevel.isBlank();
		if (!hasKeyword && isEmpty(regions) && isEmpty(jobCategories) && !hasWorkType && !hasEducation) {
			return null;
		}
		BoolQuery.Builder bool = new BoolQuery.Builder();
		if (hasKeyword) {
			bool.must(q -> q.multiMatch(m -> m.query(keyword)
				.fields("title", "companyName", "regions", "jobCategories")));
		}
		if (!isEmpty(regions)) {
			bool.filter(q -> q.terms(t -> t.field("regions.keyword")
				.terms(v -> v.value(regions.stream().map(FieldValue::of).toList()))));
		}
		if (!isEmpty(jobCategories)) {
			bool.filter(q -> q.terms(t -> t.field("jobCategories.keyword")
				.terms(v -> v.value(jobCategories.stream().map(FieldValue::of).toList()))));
		}
		if (hasWorkType) {
			bool.filter(q -> q.term(t -> t.field("workType").value(workType)));
		}
		if (hasEducation) {
			bool.filter(q -> q.term(t -> t.field("educationLevel").value(educationLevel)));
		}
		// A permanent tombstone deliberately has no searchable metadata. Fail closed
		// also for documents missing the new ingestion visibility contract.
		bool.filter(q -> q.term(t -> t.field("deleted").value(false)));
		return bool.build()._toQuery();
	}

	private static boolean isEmpty(List<?> values) {
		return values == null || values.isEmpty();
	}
}
