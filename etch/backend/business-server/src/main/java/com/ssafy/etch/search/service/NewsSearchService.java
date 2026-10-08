package com.ssafy.etch.search.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHitSupport;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;

import com.ssafy.etch.search.document.NewsDocument;
import com.ssafy.etch.search.dto.NewsSearchResponseDTO;

import lombok.RequiredArgsConstructor;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;

@Service
@RequiredArgsConstructor
public class NewsSearchService {

	private final ElasticsearchOperations elasticsearchOperations;

	public Page<NewsSearchResponseDTO> search(
		String keyword,
		int page,
		int size
	) {
		Query searchQuery = buildQuery(keyword);
		if (searchQuery == null) {
			return Page.empty();
		}

		Pageable pageable = PageRequest.of(page, size);

		NativeQuery query = NativeQuery.builder()
			.withQuery(searchQuery)
			.withPageable(pageable)        // ★ 페이지네이션
			.withTrackTotalHits(true)      // ★ 전체 개수 정확히 계산
			.build();

		SearchHits<NewsDocument> hits =
			elasticsearchOperations.search(query, NewsDocument.class);

		// Page<SearchHit<NewsDocument>> → Page<NewsSearchResponseDTO>
		return SearchHitSupport.searchPageFor(hits, pageable)
			.map(SearchHit::getContent)
			.map(NewsSearchResponseDTO::from);
	}

    static Query buildQuery(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }
        return Query.of(q -> q.bool(b -> b
            .must(m -> m.multiMatch(mm -> mm.query(keyword).fields("title^2", "summary", "companyName")))
            .filter(f -> f.term(t -> t.field("deleted").value(false)))));
    }
}
