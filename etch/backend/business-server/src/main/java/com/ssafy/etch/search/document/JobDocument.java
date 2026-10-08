package com.ssafy.etch.search.document;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.DateFormat;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.annotations.Mapping;
import org.springframework.data.elasticsearch.annotations.Setting;

import lombok.Getter;

@Document(indexName = "job-v3", createIndex = false)
@Getter
@Setting(settingPath = "/es/job-settings.json")
@Mapping(mappingPath = "/es/job-mappings.json")

public class JobDocument {
    @Field(type = FieldType.Boolean)
    private boolean deleted;

    @Field(type = FieldType.Long)
    private Long syncRevision;

	@Id
	private Long jobId;

	@Field(type = FieldType.Text, analyzer = "my_nori_analyzer")
	private String title; // 검색어 대상

	@Field(type = FieldType.Text, analyzer = "my_nori_analyzer")
	private String companyName; // 검색어 대상

	@Field(type = FieldType.Text, analyzer = "my_nori_analyzer")
	private List<String> industries;

	@Field(type = FieldType.Text, analyzer = "my_nori_analyzer")
	private List<String> regions; // 지역 필터, 검색 대상 (다중 가능)

	@Field(type = FieldType.Text, analyzer = "my_nori_analyzer")
	private List<String> jobCategories; // 직무 필터, 검색 대상 (다중 가능)

	@Field(type = FieldType.Keyword)
	private String workType; // 필터

	@Field(type = FieldType.Keyword)
	private String educationLevel; // 필터

	@Field(type = FieldType.Date, format = {DateFormat.date_hour_minute_second,
		DateFormat.date_hour_minute_second_millis, DateFormat.date_time})
	private LocalDateTime openingDate;

	@Field(type = FieldType.Date, format = {DateFormat.date_hour_minute_second,
		DateFormat.date_hour_minute_second_millis, DateFormat.date_time})
	private LocalDateTime expirationDate;
}
