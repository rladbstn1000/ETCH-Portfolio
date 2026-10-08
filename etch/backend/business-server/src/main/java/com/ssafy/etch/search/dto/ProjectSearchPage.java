package com.ssafy.etch.search.dto;

import java.util.List;

/**
 * A page is an Elasticsearch candidate window, filtered against current DB visibility.
 * Its content can be empty while another candidate window is available. Neither the
 * ES hit count nor the current visible page size is an exact public-result total.
 */
public record ProjectSearchPage(List<ProjectSearchResponseDTO> content, Metadata page) {
	public ProjectSearchPage {
		content = List.copyOf(content);
	}

	public static ProjectSearchPage of(List<ProjectSearchResponseDTO> content, int number, int size,
		boolean hasNext) {
		return new ProjectSearchPage(content, new Metadata(number, size, null, null, false,
			hasNext, number > 0, hasNext ? number + 1 : null));
	}

	public record Metadata(int number, int size, Long totalElements, Integer totalPages,
		boolean totalExact, boolean hasNext, boolean hasPrevious, Integer nextPage) {
	}
}
