package com.ssafy.etch.search.service;

import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;

import com.ssafy.etch.project.repository.ProjectRepository;
import com.ssafy.etch.search.document.ProjectDocument;
import com.ssafy.etch.search.dto.ProjectSearchPage;
import com.ssafy.etch.search.dto.ProjectSearchResponseDTO;
import com.ssafy.etch.search.enumeration.ProjectSort;

import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProjectSearchService {

	private final ElasticsearchOperations elasticsearchOperations;
	private final ProjectRepository projectRepository;

	public ProjectSearchPage search(
		@Nullable String keyword,
		@Nullable String projectCategory,    // enum name 문자열 (예: "BACKEND")
		@Nullable ProjectSort sortOpt,
		int page,
		int size
	) {
		// Validate the same page/size contract even for an empty query.
		PageRequest.of(page, size);
		boolean hasKeyword = keyword != null && !keyword.isBlank();
		boolean hasCategory = projectCategory != null && !projectCategory.isBlank();
		if (!hasKeyword && !hasCategory)
			return ProjectSearchPage.of(List.of(), page, size, false);

		BoolQuery.Builder bool = new BoolQuery.Builder();
		// Tombstones permanently retain the external revision but must never be hits.
		bool.filter(q -> q.term(t -> t.field("visible").value(true)));
		if (hasKeyword) {
			bool.must(q -> q.multiMatch(m -> m.query(keyword)
				.fields("title^3", "memberName^2", "projectTechs")));
		}
		if (hasCategory) {
			bool.filter(q -> q.term(t -> t.field("projectCategory").value(projectCategory)));
		}

		// 2) Pageable + Sort
		ProjectSort sort = (sortOpt == null) ? ProjectSort.LATEST : sortOpt;
		Sort sortSpec = switch (sort) {
			case VIEWS -> Sort.by(Sort.Order.desc("viewCount"), Sort.Order.desc("createdAt"));
			case LIKES -> Sort.by(Sort.Order.desc("likeCount"), Sort.Order.desc("createdAt"));
			case LATEST -> Sort.by(Sort.Order.desc("createdAt"));
		};
		// Stable order within equal counters/dates; changes between requests remain eventually consistent.
		Pageable pageable = PageRequest.of(page, size, sortSpec.and(Sort.by("projectId")));

		// Raw hit count is used only to decide whether another candidate window exists.
		NativeQuery query = NativeQuery.builder()
			.withQuery(bool.build()._toQuery())
			.withPageable(pageable)
			.withTrackTotalHits(true)
			.build();

		SearchHits<ProjectDocument> hits = elasticsearchOperations.search(query, ProjectDocument.class);
		List<ProjectDocument> candidates = hits.getSearchHits().stream().map(SearchHit::getContent).toList();
		List<Long> ids = candidates.stream().map(ProjectDocument::getProjectId)
			.filter(Objects::nonNull).distinct().toList();

		// One current-state DB query per candidate page. Never fall back to ES on DB failure.
		// Filter before DTO conversion so hidden title/thumbnail/other fields cannot survive.
		Set<Long> publicIds = ids.isEmpty() ? Set.of()
			: new HashSet<>(projectRepository.findPublicIdsByIdIn(ids));
		List<ProjectSearchResponseDTO> visible = candidates.stream()
			.filter(document -> document.getProjectId() != null && publicIds.contains(document.getProjectId()))
			.map(ProjectSearchResponseDTO::from).toList();
		boolean hasNext = hits.getTotalHits() > pageable.getOffset() + size;
		return ProjectSearchPage.of(visible, page, size, hasNext);
	}

}
