package com.ssafy.etch.job.entity;

import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

public enum ApplyStatusType {
    SCHEDULED("예정"),
    DOCUMENT_DONE("서류 제출 완료"),
    DOCUMENT_FAILED("서류 탈락"),
    INTERVIEW_DONE("면접 완료"),
    INTERVIEW_FAILED("면접 탈락"),
    FINAL_PASSED("최종 합격");

    private final String description;

    ApplyStatusType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    public static Map<ApplyStatusType, String> getStatusDescriptionMap() {
        return Arrays.stream(ApplyStatusType.values())
                .collect(Collectors.toMap(
                        status -> status,
                        ApplyStatusType::getDescription
                ));
    }
}
