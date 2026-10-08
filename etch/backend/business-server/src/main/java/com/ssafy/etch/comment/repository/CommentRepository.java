package com.ssafy.etch.comment.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ssafy.etch.comment.entity.CommentEntity;

public interface CommentRepository extends JpaRepository<CommentEntity, Long> {
	List<CommentEntity> findAllByProject_IdAndIsDeletedFalseOrderByCreatedAtDesc(Long projectId);
}
