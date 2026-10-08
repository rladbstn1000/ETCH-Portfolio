package com.ssafy.etch.search.document;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.Map;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.data.elasticsearch.core.convert.MappingElasticsearchConverter;
import org.springframework.data.elasticsearch.core.document.Document;
import org.springframework.data.elasticsearch.core.mapping.SimpleElasticsearchMappingContext;

class SearchDateConversionTest {
    @ParameterizedTest
    @ValueSource(strings = {"2026-09-02T09:00:00", "2026-09-02T09:00:00.000", "2026-09-02T09:00:00.000Z"})
    void readsSeedAndLogstashDateFormats(String date) throws Exception {
        var converter = new MappingElasticsearchConverter(new SimpleElasticsearchMappingContext());
        converter.afterPropertiesSet();
        var job = converter.read(JobDocument.class,
            Document.from(Map.of("jobId", 9001L, "openingDate", date, "expirationDate", date)));
        var news = converter.read(NewsDocument.class,
            Document.from(Map.of("newsId", 9001L, "publishedAt", date)));
        var expected = LocalDateTime.of(2026, 9, 2, 9, 0);
        assertThat(job.getOpeningDate()).isEqualTo(expected);
        assertThat(job.getExpirationDate()).isEqualTo(expected);
        assertThat(news.getPublishedAt()).isEqualTo(expected);
    }
}
