package com.ssafy.etch.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(
    basePackages = {
        "com.ssafy.etch.file.repository",
        "com.ssafy.etch.tech.repository",
        "com.ssafy.etch.comment.repository",
        "com.ssafy.etch.company.repository",
        "com.ssafy.etch.coverLetter.repository", 
        "com.ssafy.etch.follow.repository",
        "com.ssafy.etch.job.repository",
        "com.ssafy.etch.like.repository",
        "com.ssafy.etch.member.repository",
        "com.ssafy.etch.news.repository",
        "com.ssafy.etch.project.repository",
        "com.ssafy.etch.portfolio.repository"
    }
)
@EnableElasticsearchRepositories(
    basePackages = "com.ssafy.etch.search.repository"
)
public class ElasticsearchConfig {
    // Elasticsearch와 JPA Repository를 명확히 분리
}
