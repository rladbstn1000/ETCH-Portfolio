package com.ssafy.etch.global.util;

import java.util.Optional;
import java.util.Set;

import org.springframework.web.multipart.MultipartFile;

public class FileUtil {

    // 이미지: .png/.jpg만, 각 5MB 이하
    private static final Set<String> ALLOWED_IMAGE_CT = Set.of("image/jpeg", "image/png");
    private static final Set<String> ALLOWED_IMAGE_EXT = Set.of(".jpg", ".png");
    private static final long MAX_SIZE = 5L * 1024 * 1024; // 5MB

    // 유효성 검증
    public static boolean isImageOk(MultipartFile f) {
        if (f == null || f.isEmpty()) return false;
        String ct = Optional.ofNullable(f.getContentType()).orElse("").toLowerCase();
        String name = Optional.ofNullable(f.getOriginalFilename()).orElse("").toLowerCase();
        boolean ctOk = ALLOWED_IMAGE_CT.contains(ct);
        boolean extOk = ALLOWED_IMAGE_EXT.stream().anyMatch(name::endsWith);
        return ctOk && extOk && f.getSize() <= MAX_SIZE;
    }
}
