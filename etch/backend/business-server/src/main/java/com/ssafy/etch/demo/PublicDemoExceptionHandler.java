package com.ssafy.etch.demo;

import com.ssafy.etch.global.exception.CustomException;
import com.ssafy.etch.global.response.ApiResponse;
import java.util.NoSuchElementException;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
@Profile("public-demo")
@Order(Ordered.HIGHEST_PRECEDENCE)
public class PublicDemoExceptionHandler {
    @ExceptionHandler({IllegalArgumentException.class, org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class,
        org.springframework.web.bind.MissingServletRequestParameterException.class})
    ResponseEntity<ApiResponse<Object>> invalid(Exception exception) { return error(400, "잘못된 입력입니다."); }

    @ExceptionHandler({NoSuchElementException.class, jakarta.persistence.EntityNotFoundException.class})
    ResponseEntity<ApiResponse<Object>> missing(Exception exception) { return error(404, "조회한 결과가 없습니다."); }

    @ExceptionHandler(CustomException.class)
    ResponseEntity<ApiResponse<Object>> application(CustomException exception) {
        int status = exception.getErrorCode().getStatus().value();
        return error(status, status == 404 ? "조회한 결과가 없습니다." : "요청을 처리할 수 없습니다.");
    }

    @ExceptionHandler(org.springframework.dao.DataAccessResourceFailureException.class)
    ResponseEntity<ApiResponse<Object>> unavailable(Exception exception) {
        return error(503, "데이터 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiResponse<Object>> other(Exception exception) { return error(500, "서버 내부 오류가 발생했습니다."); }

    private ResponseEntity<ApiResponse<Object>> error(int status, String message) {
        return ResponseEntity.status(status).body(ApiResponse.error(message));
    }
}
