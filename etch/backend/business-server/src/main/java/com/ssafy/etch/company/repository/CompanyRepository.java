package com.ssafy.etch.company.repository;

import java.util.List;
import java.util.Optional;

import com.ssafy.etch.company.entity.CompanyEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;

public interface CompanyRepository extends JpaRepository<CompanyEntity, Long> {
	Optional<CompanyEntity> findById(long id);
    List<CompanyEntity> findAllByIdIn(Collection<Long> id);
}
