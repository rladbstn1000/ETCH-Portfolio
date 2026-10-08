package com.ssafy.etch.search.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

class JobSearchQueryTest {
    @Test
    void quotesBackslashesAndNewlinesRemainQueryValues() {
        String input = "합성 \"개발자\" \\ 검색\n다음 줄";
        var query = JobSearchService.buildQuery(input, null, null, null, null);
        assertThat(query.bool().must().get(0).multiMatch().query()).isEqualTo(input);
    }

    @Test
    void exactFiltersUseKeywordFieldsAndPreserveSpecialCharacters() {
        var query = JobSearchService.buildQuery(null, List.of("서울"),
            List.of("DevOps/클라우드"), "정규직", "학력무관");
        var filters = query.bool().filter();
        assertThat(filters.get(0).terms().field()).isEqualTo("regions.keyword");
        assertThat(filters.get(1).terms().field()).isEqualTo("jobCategories.keyword");
        assertThat(filters.get(1).terms().terms().value().get(0).stringValue())
            .isEqualTo("DevOps/클라우드");
        assertThat(filters.get(2).term().value().stringValue()).isEqualTo("정규직");
    }

    @Test
    void emptySearchPreservesExistingEmptyResultContract() {
        assertThat(JobSearchService.buildQuery(" ", List.of(), null, "", " ")).isNull();
    }

    @Test
    void keywordAndFilterOnlyQueriesBothExcludeDeletedDocuments() {
        for (var query : List.of(
            JobSearchService.buildQuery("채용", null, null, null, null),
            JobSearchService.buildQuery(null, List.of("서울"), null, null, null))) {
            assertThat(query.bool().filter()).anySatisfy(filter -> {
                assertThat(filter.isTerm()).isTrue();
                assertThat(filter.term().field()).isEqualTo("deleted");
                assertThat(filter.term().value().booleanValue()).isFalse();
            });
        }
    }
}
