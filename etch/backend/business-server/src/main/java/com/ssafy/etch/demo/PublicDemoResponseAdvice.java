package com.ssafy.etch.demo;

import com.ssafy.etch.company.dto.CompanyInfoDTO;
import com.ssafy.etch.global.response.ApiResponse;
import com.ssafy.etch.project.dto.ProjectDetailDTO;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

/** Explicit public fields for the two details which otherwise contain unused profile/company attributes. */
@RestControllerAdvice
@Profile("public-demo")
public class PublicDemoResponseAdvice implements ResponseBodyAdvice<Object> {
    public record PublicProject(Long id, String title, String content, String thumbnailUrl, Long viewCount,
        Long likeCount, String nickname, LocalDateTime createdAt, LocalDateTime updatedAt, String projectCategory,
        List<String> techCategories, List<String> techCodes, List<String> fileUrls, Boolean isPublic) {}
    public record PublicCompany(Long id, String name, String industry, String mainProducts, String ceoName,
        String summary, LocalDate foundedDate, Long totalEmployees, Long salary, Long serviceYear) {}

    @Override public boolean supports(MethodParameter parameter, Class<? extends HttpMessageConverter<?>> converter) { return true; }

    @Override public Object beforeBodyWrite(Object body, MethodParameter parameter, MediaType mediaType,
        Class<? extends HttpMessageConverter<?>> converter, ServerHttpRequest request, ServerHttpResponse response) {
        if (!(body instanceof ApiResponse<?> api) || !api.isSuccess()) return body;
        if (api.getData() instanceof ProjectDetailDTO detail) {
            return ApiResponse.success(new PublicProject(detail.getId(), detail.getTitle(), detail.getContent(),
                detail.getThumbnailUrl(), detail.getViewCount(), detail.getLikeCount(), detail.getNickname(),
                detail.getCreatedAt(), detail.getUpdatedAt(), detail.getProjectCategory(), detail.getTechCategories(),
                detail.getTechCodes(), detail.getFileUrls(), detail.getIsPublic()));
        }
        if (api.getData() instanceof CompanyInfoDTO company) {
            return ApiResponse.success(new PublicCompany(company.getId(), company.getName(), company.getIndustry(),
                company.getMainProducts(), company.getCeoName(), company.getSummary(), company.getFoundedDate(),
                company.getTotalEmployees(), company.getSalary(), company.getServiceYear()));
        }
        return body;
    }
}
