package com.ssafy.etch.global.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ErrorCode {
	USER_NOT_FOUND("USER_404", "사용자를 찾을 수 없습니다."),
	INVALID_INPUT("INPUT_400", "잘못된 입력입니다."),
	INTERNAL_ERROR("INTERNAL_500", "서버 오류가 발생했습니다."),
	UNAUTHENTICATED_USER("AUTH_401", "인증되지 않은 사용자입니다."),
	ACCESS_TOKEN_EXPIRED("ACCESS_TOKEN_401", "액세스 토큰이 만료되었습니다."),
	ACCESS_TOKEN_INVALID("ACCESS_TOKEN_401", "유효하지 않은 액세스 토큰입니다."),
	REFRESH_TOKEN_EXPIRED("REFRESH_TOKEN_401", "리프레시 토큰이 만료되었습니다."),
	REFRESH_TOKEN_INVALID("REFRESH_TOKEN_401", "유효하지 않은 리프레시 토큰입니다."),
	ALREADY_LIKED("LIKE_400", "이미 좋아요를 누른 콘텐츠입니다."),
	LIKE_NOT_FOUND("LIKE_404", "좋아요 정보가 존재하지 않습니다."),
	CONTENT_NOT_FOUND("CONTENT_404", "조회한 결과가 없습니다."),
	ACCESS_DENIED("AUTH_403", "해당 리소스에 대한 접근 권한이 없습니다."),
	FILE_UPLOAD_FAILED("FILE_500", "파일 업로드에 실패했습니다."),
	INVALID_FILE_EXTENSION("FILE_400", "잘못된 형식의 파일입니다."),
	CONTENT_DELETED("CONTENT_404", "삭제된 컨텐츠입니다."),
	USER_WITHDRAWN("USER_410", "탈퇴한 사용자입니다."),
	ALREADY_APPLIED("APPLIED_400", "이미 지원한 공고입니다."),
	JOB_NOT_FOUND("JOB_404", "채용공고를 찾을 수 없습니다");
	private final String code;
	private final String message;

    public HttpStatus getStatus() {
        return HttpStatus.valueOf(Integer.parseInt(code.substring(code.lastIndexOf('_') + 1)));
    }
}
