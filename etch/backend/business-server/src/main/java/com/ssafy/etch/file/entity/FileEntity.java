package com.ssafy.etch.file.entity;

import static jakarta.persistence.FetchType.*;

import com.ssafy.etch.project.entity.ProjectEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "project_file")
@Getter
@NoArgsConstructor
public class FileEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String name;

	@Column(name = "file_url")
	private String fileUrl; // 사진/파일 url

	@ManyToOne(fetch = LAZY)
	@JoinColumn(name = "project_post_id")
	private ProjectEntity project;

	public static FileEntity image(ProjectEntity p, String name, String fileUrl) {
		FileEntity f = new FileEntity();
		f.project = p;
		f.name = name;
		f.fileUrl = fileUrl;
		return f;
	}

	public static FileEntity of(ProjectEntity project, String name, String fileUrl) {
		FileEntity f = new FileEntity();
		f.project = project;
		f.name = name;
		f.fileUrl = fileUrl;
		return f;
	}

	public void setProject(ProjectEntity project) { this.project = project; }
}
