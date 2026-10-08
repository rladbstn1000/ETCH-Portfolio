package com.ssafy.etch.job.repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ssafy.etch.job.entity.JobEntity;

public interface JobRepository extends JpaRepository<JobEntity, Long> {
	List<JobEntity> findAllByIdIn(Collection<Long> ids);

	@Query("""
		    SELECT j FROM JobEntity j
		    WHERE
		      (j.openingDate    >= :startInclusive AND j.openingDate    < :endExclusive)
		      OR
		      (j.expirationDate >= :startInclusive AND j.expirationDate < :endExclusive)
		""")
	List<JobEntity> findJobsStartingOrEndingInPeriod(@Param("startInclusive") LocalDateTime startInclusive,
		@Param("endExclusive") LocalDateTime endExclusive);

	@Query("""
		SELECT j FROM JobEntity j
		WHERE j.expirationDate >= :startInclusive AND j.expirationDate < :endExclusive
		""")
	List<JobEntity> findByExpirationDateInPeriod(
		@Param("startInclusive") LocalDateTime startInclusive,
		@Param("endExclusive") LocalDateTime endExclusive
	);
}
