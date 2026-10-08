package com.ssafy.etch.project.entity;

import static jakarta.persistence.FetchType.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.ssafy.etch.file.entity.FileEntity;
import com.ssafy.etch.comment.entity.CommentEntity;
import com.ssafy.etch.member.entity.MemberEntity;

import com.ssafy.etch.project.dto.ProjectDTO;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "project_post")
@Getter
@NoArgsConstructor
public class ProjectEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String title;

	@Column(columnDefinition = "TEXT", nullable = false)
	private String content;

	@Column(name = "thumbnail_url")
	private String thumbnailUrl; // s3

	@Column(name = "youtube_url", length = 500)
	private String youtubeUrl; // 영상 업로드용 유튜브 링크

	@Column(name = "view_count")
	private Long viewCount;

	@Enumerated(EnumType.STRING)
	@Column(name = "category")
	private ProjectCategory projectCategory;

	@Column(name = "created_at", updatable = false)
	@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm", timezone = "Asia/Seoul")
	private LocalDateTime createdAt;

	@Column(name = "updated_at")
	@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm", timezone = "Asia/Seoul")
	private LocalDateTime updatedAt;

	@PrePersist
	public void prePersist() {
		this.createdAt = LocalDateTime.now();
		this.updatedAt = null; // 생성 시점에는 null
	}

	@PreUpdate
	public void preUpdate() {
		this.updatedAt = LocalDateTime.now();
	}

	@Column(name = "is_deleted")
	private Boolean isDeleted;

	@Column(name = "github_url")
	private String githubUrl;

	@Column(name = "is_public")
	private Boolean isPublic;

	@ManyToOne(fetch = LAZY)
	@JoinColumn(name = "member_id", nullable = false)
	private MemberEntity member;

	@OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true, fetch = LAZY)
	private List<CommentEntity> comments = new ArrayList<>();

	@OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true, fetch = LAZY)
	private List<FileEntity> files = new ArrayList<>(); // 본문 이미지/파일들 (PNG/JPG, PDF 등)

	@OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<ProjectTechEntity> projectTechs = new ArrayList<>();

	// liked_content table에서 PROJECT 타입만 카운트해서 likeCount로 보여주기
	@org.hibernate.annotations.Formula("""
		(SELECT COUNT(1)
		 FROM liked_content lc
		 WHERE lc.type = 'PROJECT'
		 AND lc.targetId = id)
		""")
	private Integer likeCount;

	// 댓글 수 /
	@org.hibernate.annotations.Formula("""
		(SELECT COUNT(1)
		 FROM project_comment c
		 WHERE c.project_post = id
		 AND c.is_deleted = 0)
	""")
	private Integer commentCount;

	// 인기점수 계산: 좋아요*4 + 댓글*3 + 조회수*2,
	@org.hibernate.annotations.Formula("""
		(
			(SELECT COUNT(1)
			 FROM liked_content lc
			 WHERE lc.type = 'PROJECT' AND lc.targetId = id) * 4
		  + (SELECT COUNT(1)
		  	 FROM project_comment c
		  	 WHERE c.project_post = id AND c.is_deleted = 0) * 3
		  + COALESCE(view_count, 0) * 2
		)
	""")
	private Double popularityScore;

	public ProjectDTO toProjectDTO() {
		return ProjectDTO.builder()
			.id(id)
			.title(title)
			.content(content)
			.thumbnailUrl(thumbnailUrl)
			.youtubeUrl(youtubeUrl)
			.viewCount(viewCount)
			.createdAt(createdAt)
			.updatedAt(updatedAt != null ? updatedAt : createdAt)
			.isDeleted(isDeleted)
			.githubUrl(githubUrl)
			.isPublic(isPublic)
			.member(member)
			.projectCategory(projectCategory)
			.projectTechs(projectTechs)
			.comments(comments)
			.files(files)
			.likeCount(this.likeCount)
			.commentCount(this.commentCount)
			.popularityScore(this.popularityScore)
			.build();
	}

	@Builder
	private ProjectEntity(String title, String content, ProjectCategory projectCategory,
		String githubUrl, Boolean isPublic, MemberEntity member) {
		this.title = title;
		this.content = content;
		this.projectCategory = projectCategory;
		this.githubUrl = githubUrl;
		this.isPublic = isPublic;
		this.member = member;
		this.viewCount = 0L;
		this.isDeleted = false;
		this.createdAt = LocalDateTime.now();
		this.updatedAt = LocalDateTime.now();
	}

	public void hit() { this.viewCount = this.viewCount + 1; }

	public void changeThumbnail(String url) { this.thumbnailUrl = url; }
	public void changeYoutubeUrl(String url) { this.youtubeUrl = url; }

	public void change(String title, String content, ProjectCategory projectCategory,
		String githubUrl, Boolean isPublic) {
		this.title = title;
		this.content = content;
		this.projectCategory = projectCategory;
		this.githubUrl = githubUrl;
		this.isPublic = isPublic;
		this.updatedAt = LocalDateTime.now();
	}

	public void addFile(FileEntity file) {
		this.files.add(file);
		file.setProject(this);
	}

	public void removeFile(FileEntity file) {
		this.files.remove(file);
		file.setProject(null);
	}

	public void addProjectTech(ProjectTechEntity link) {
		this.projectTechs.add(link);
	}
}
