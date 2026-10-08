package com.ssafy.etch.project.service;

import com.ssafy.etch.global.exception.CustomException;
import com.ssafy.etch.global.exception.ErrorCode;
import com.ssafy.etch.project.entity.ProjectEntity;

/** Shared by project detail and its comments; authorization must precede side effects. */
public final class ProjectAccessPolicy {
    private ProjectAccessPolicy() {}

    public static void requireReadable(ProjectEntity project, Long memberId) {
        if (Boolean.TRUE.equals(project.getIsDeleted())) {
            throw new CustomException(ErrorCode.CONTENT_NOT_FOUND);
        }
        if (Boolean.TRUE.equals(project.getIsPublic())) {
            return;
        }
        if (memberId == null) {
            throw new CustomException(ErrorCode.UNAUTHENTICATED_USER);
        }
        if (!memberId.equals(project.getMember().getId())) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
    }
}
