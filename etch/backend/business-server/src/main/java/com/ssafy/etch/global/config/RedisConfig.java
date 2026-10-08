package com.ssafy.etch.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Redis 설정 파일
 * - LettuceConnectionFactory: Redis connection pool 관리
 * - RedisTemplate: 문자열 crud 가능
 */
@Configuration
public class RedisConfig {

	@Value("${spring.data.redis.host}")
	private String host;

	@Value("${spring.data.redis.port}")
	private int port;

	@Value("${spring.data.redis.database}")
	private int database;

	/**
	 * RedisStandaloneConfiguration에 정의된 host, port, db 정보를
	 * LettuceConnectionFactory로 생성해서 bean으로 등록
	 */
	@Bean
	public LettuceConnectionFactory redisConnectionFactory() {
		// Redis 서버 연결정보 세팅
		RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
		config.setHostName(host);
		config.setPort(port);
		config.setDatabase(database);

		return new LettuceConnectionFactory(config); // 미리 만들어 놓은 통로를 통해 전달
	}

	/**
	 * RedisTemplate bean 등록
	 * - 가독성 위해 직렬화 적용함, 문자열 처리
	 */
	@Bean
	public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
		return new StringRedisTemplate(connectionFactory);
	}

	@Bean
	public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) { // redis에 명령어를 쉽게 날려주는 상자
		RedisTemplate<String, Object> template = new RedisTemplate<>();
		template.setConnectionFactory(factory);

		StringRedisSerializer strRedisSerializer = new StringRedisSerializer();
		template.setKeySerializer(strRedisSerializer);
		template.setValueSerializer(strRedisSerializer);
		template.setHashKeySerializer(strRedisSerializer);
		template.setHashValueSerializer(strRedisSerializer);

		return template;
	}
}
