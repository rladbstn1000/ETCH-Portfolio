package com.ssafy.etch.oauth.service;

import com.ssafy.etch.member.dto.MemberDTO;
import com.ssafy.etch.member.entity.MemberEntity;
import com.ssafy.etch.member.repository.MemberRepository;
import com.ssafy.etch.oauth.dto.CustomOAuth2User;
import com.ssafy.etch.oauth.dto.GoogleResponse;
import com.ssafy.etch.oauth.dto.OAuth2Response;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class CustomOAuth2UserService  extends DefaultOAuth2UserService {
    private final MemberRepository memberRepository;
    public CustomOAuth2UserService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        OAuth2Response oAuth2Response = new GoogleResponse(oAuth2User.getAttributes());

        // 이메일을 통해 기존 회원인지 확인
        MemberEntity existData = memberRepository.findByEmail(oAuth2Response.getEmail()).orElse(null);

        // 처음 로그인 하는 회원(GUEST)
        if (existData == null) {
            MemberDTO memberDTO = MemberDTO.builder()
                    .email(oAuth2Response.getEmail())
                    .role("GUEST")
                    .build();
            return new CustomOAuth2User(memberDTO);
        }
        // 이미 가입된 회원(USER)
        else {
            if (existData.toMemberDTO().isDeleted()) {
                throw new OAuth2AuthenticationException("탈퇴한 회원입니다.");
            }
            return new CustomOAuth2User(existData.toMemberDTO());
        }
    }
}
