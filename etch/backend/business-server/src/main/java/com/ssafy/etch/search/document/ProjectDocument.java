package com.ssafy.etch.search.document;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.DateFormat;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.annotations.Mapping;
import org.springframework.data.elasticsearch.annotations.Setting;

import com.ssafy.etch.project.entity.ProjectEntity;
import com.ssafy.etch.project.entity.ProjectTechEntity;
import com.ssafy.etch.tech.entity.TechCodeEntity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Document(indexName = "project-v2", createIndex = false)
@Getter
@AllArgsConstructor
@Builder
@Setting(settingPath = "/es/project-settings.json")
@Mapping(mappingPath = "/es/project-mappings.json")
public class ProjectDocument {
	@Field(type = FieldType.Boolean)
	private Boolean visible;

	@Field(type = FieldType.Long)
	private Long searchRevision;

	@Id
	private Long projectId;

	@Field(type = FieldType.Text, analyzer = "my_nori_analyzer")
	private String title;

	@Field(type = FieldType.Text, analyzer = "my_nori_analyzer")
	private String memberName;

	@Field(type = FieldType.Keyword)
	private String projectCategory;

	@Field(type = FieldType.Text, analyzer = "my_nori_analyzer")
	private List<String> projectTechs;

	@Field(type = FieldType.Keyword)
	private String thumbnailUrl;

	@Field(type = FieldType.Integer)
	private Integer likeCount;

	@Field(type = FieldType.Long)
	private Long viewCount;

	@Field(type = FieldType.Date, format = DateFormat.date)
	private LocalDate createdAt;

	@Field(type = FieldType.Date, format = DateFormat.date)
	private LocalDate updatedAt;

	public static ProjectDocument from(ProjectEntity projectEntity) {
		return ProjectDocument.builder()
			.projectId(projectEntity.getId())
			.title(projectEntity.getTitle())
			.memberName(projectEntity.getMember().toMemberDTO().getNickname())
			.projectCategory(projectEntity.getProjectCategory().name())
			.projectTechs(projectEntity.getProjectTechs().stream().map(ProjectTechEntity::getTechCode).map(
				TechCodeEntity::getCodeName).toList())
			.thumbnailUrl(projectEntity.getThumbnailUrl())
			.likeCount(projectEntity.getLikeCount())
			.viewCount(projectEntity.getViewCount())
			.createdAt(projectEntity.getCreatedAt().toLocalDate())
			.updatedAt((projectEntity.getUpdatedAt() != null
				? projectEntity.getUpdatedAt() : projectEntity.getCreatedAt()).toLocalDate())
			.build();
	}
}
