package com.ssafy.etch.file.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.ssafy.etch.file.entity.FileEntity;

import io.lettuce.core.dynamic.annotation.Param;

public interface FileRepository extends JpaRepository<FileEntity, Long> {
	@Query("SELECT f FROM FileEntity f WHERE f.project.id = :projectId")
	List<FileEntity> findAllByProjectId(@Param("projectId") Long projectId);

	@Query("SELECT f FROM FileEntity f WHERE f.id IN :ids AND f.project.id = :projectId")
	List<FileEntity> findAllByIdInAndProjectId(@Param("ids") List<Long> ids, @Param("projectId") Long projectId);

	@Modifying
	@Query("DELETE FROM FileEntity f WHERE f.id IN :ids AND f.project.id = :projectId")
	void deleteByIdsAndProjectId(@Param("ids") List<Long> ids, @Param("projectId") Long projectId);

	List<FileEntity> findByProjectId(Long projectId);
}
