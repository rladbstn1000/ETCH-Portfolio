package com.ssafy.etch.search.document;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.DateFormat;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.annotations.Mapping;
import org.springframework.data.elasticsearch.annotations.Setting;

import lombok.Getter;

@Document(indexName = "news-v3", createIndex = false)
@Getter
@Setting(settingPath = "/es/news-settings.json")
@Mapping(mappingPath = "/es/news-mappings.json")
public class NewsDocument {
    @Field(type = FieldType.Boolean)
    private boolean deleted;

    @Field(type = FieldType.Long)
    private Long syncRevision;


	@Id
	private Long newsId;

	@Field(type = FieldType.Text, analyzer = "my_nori_analyzer")
	private String title;

	@Field(type = FieldType.Text, analyzer = "my_nori_analyzer")
	private String summary;

	@Field(type = FieldType.Text, analyzer = "my_nori_analyzer")
	private String companyName;

	@Field(type = FieldType.Keyword)
	private String link;

	@Field(type = FieldType.Keyword)
	private String thumbnailUrl;

	@Field(type = FieldType.Date, format = {DateFormat.date_hour_minute_second,
		DateFormat.date_hour_minute_second_millis, DateFormat.date_time})
	private LocalDateTime publishedAt;
}
