package com.ssafy.etch.search.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class NewsSearchQueryTest {
    @Test
    void quotesAndEscapesRemainLiteralValuesWithExistingFieldBoosts() {
        String input = "합성 \"뉴스\" \\ 검색\n다음 줄";
        var query = NewsSearchService.buildQuery(input);
        var match = query.bool().must().get(0).multiMatch();
        assertThat(match.query()).isEqualTo(input);
        assertThat(match.fields()).containsExactly("title^2", "summary", "companyName");
    }

    @Test
    void deletedFalseIsRequiredAlongsideKeyword() {
        var query = NewsSearchService.buildQuery("뉴스");
        assertThat(query.bool().filter()).singleElement().satisfies(filter -> {
            assertThat(filter.term().field()).isEqualTo("deleted");
            assertThat(filter.term().value().booleanValue()).isFalse();
        });
    }

    @Test
    void blankKeywordKeepsExistingEmptyResultContract() {
        assertThat(NewsSearchService.buildQuery(null)).isNull();
        assertThat(NewsSearchService.buildQuery(" \n")).isNull();
    }
}
