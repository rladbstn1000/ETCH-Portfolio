package com.ssafy.etch.company.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import com.ssafy.etch.company.dto.CompanyInfoDTO;
import com.ssafy.etch.company.entity.CompanyEntity;
import com.ssafy.etch.company.repository.CompanyRepository;

@Service
public class CompanyServiceImpl implements CompanyService {

	private final RedisTemplate<String, String> redisTemplate;
	private final CompanyRepository companyRepository;

	public CompanyServiceImpl(RedisTemplate<String, String> redisTemplate,  CompanyRepository companyRepository) {
		this.redisTemplate = redisTemplate;
		this.companyRepository = companyRepository;
	}

	// 기업정보
	@Override
	public CompanyInfoDTO getCompanyInfo(long id) {
		return companyRepository.findById(id)
			.map(CompanyEntity::toCompanyDTO)
			.map(CompanyInfoDTO::from)
			.orElseThrow(java.util.NoSuchElementException::new);
	}
}
