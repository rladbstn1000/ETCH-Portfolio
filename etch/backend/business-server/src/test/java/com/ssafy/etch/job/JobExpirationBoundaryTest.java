package com.ssafy.etch.job;

import com.ssafy.etch.job.dto.JobResponseDTO;
import com.ssafy.etch.job.repository.JobRepository;
import com.ssafy.etch.job.service.JobServiceImpl;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.ObjectMapper;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

/** Real Hibernate query/binding; the inclusive end date must not include next-day midnight. */
@DataJpaTest
class JobExpirationBoundaryTest {
    @Autowired JobRepository jobs;
    @Autowired JdbcTemplate jdbc;

    @Test void expirationDayIncludesWholeDayAndExcludesAdjacentMidnights() {
        jdbc.update("INSERT INTO company(id,name) VALUES(88001,'synthetic date company')");
        String[] dates = {"2099-12-30 23:59:59.999999", "2099-12-31 00:00:00",
            "2099-12-31 23:59:59.999999", "2100-01-01 00:00:00"};
        for (int i = 0; i < dates.length; i++) {
            jdbc.update("INSERT INTO job(id,title,external_job_id,company_id,expiration_date) VALUES(?,?,?,?,CAST(? AS TIMESTAMP))",
                88010L + i, "date fixture " + i, "boundary-" + i, 88001L, dates[i]);
        }
        var service = new JobServiceImpl(jobs, mock(RedisTemplate.class), new ObjectMapper());
        LocalDate day = LocalDate.of(2099, 12, 31);
        assertThat(service.getJobsByExpirationDate(day, day)).extracting(JobResponseDTO::getId)
            .containsExactlyInAnyOrder(88011L, 88012L);
        assertThat(service.getJobsByExpirationDate(day, day.plusDays(1))).extracting(JobResponseDTO::getId)
            .containsExactlyInAnyOrder(88011L, 88012L, 88013L);
    }
}
