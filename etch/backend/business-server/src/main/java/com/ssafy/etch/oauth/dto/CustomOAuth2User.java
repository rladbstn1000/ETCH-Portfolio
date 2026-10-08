package com.ssafy.etch.oauth.dto;

import com.ssafy.etch.member.dto.MemberDTO;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;

public class CustomOAuth2User implements OAuth2User {

    private final MemberDTO memberDTO;

    public CustomOAuth2User(MemberDTO memberDTO) {
        this.memberDTO = memberDTO;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return Map.of();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {

        Collection<GrantedAuthority> collection = new ArrayList<>();

        collection.add(new SimpleGrantedAuthority(memberDTO.getRole()));

        return collection;
    }

    @Override
    public String getName() {
        return memberDTO.getEmail();
    }
    public String getRole() {return memberDTO.getRole();}
    public String getEmail() {
        return memberDTO.getEmail();
    }
    public Long getId() {
        return memberDTO.getId();
    }
    public MemberDTO getUserDTO() {
        return memberDTO;
    }
}