package com.ssafy.etch.project.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.ssafy.etch.project.entity.ProjectTechEntity;

import io.lettuce.core.dynamic.annotation.Param;

public interface ProjectTechRepository extends JpaRepository<ProjectTechEntity, Long>{
	@Query("SELECT pt FROM ProjectTechEntity pt WHERE pt.project.id = :projectId")
	List<ProjectTechEntity> findAllByProjectId(@Param("projectId") Long projectId);

	@Modifying
	@Query("DELETE FROM ProjectTechEntity pt WHERE pt.project.id = :projectId AND pt.techCode.id IN :techIds")
	void deleteLinks(@Param("projectId") Long projectId, @Param("techIds") List<Long> techIds);

	void deleteAllByProjectId(Long projectId);
}
