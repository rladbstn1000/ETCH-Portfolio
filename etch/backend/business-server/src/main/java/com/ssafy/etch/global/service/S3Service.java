package com.ssafy.etch.global.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.ssafy.etch.global.exception.CustomException;
import com.ssafy.etch.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class S3Service {
	@Value("${cloud.aws.s3.bucket:}")
	private String bucket;

	@Value("${PUBLIC_MINIO_BASE_URL:}")
	private String publicMinioBaseUrl;

	private final org.springframework.beans.factory.ObjectProvider<StorageClient> clients;

    private StorageClient storage() {
        StorageClient client = clients.getIfAvailable();
        if (client == null) throw new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, "파일 저장 기능이 비활성화되어 있습니다.");
        return client;
    }

	public List<String> uploadFiles(List<MultipartFile> multipartFiles) {
		List<String> fileUrlList = new ArrayList<>();

		// forEach 구문을 통해 multipartFiles 리스트로 넘어온 파일들을 순차적으로 fileNameList 에 추가
		multipartFiles.forEach(file -> {
			fileUrlList.add(uploadFile(file));
		});

		return fileUrlList;
	}

	public String uploadFile(MultipartFile file) {
		String fileName = createFileName(file.getOriginalFilename());
		try (InputStream inputStream = file.getInputStream()) {
			storage().put(bucket, fileName, inputStream, file.getSize(), file.getContentType());
		} catch (IOException e) {
			throw new CustomException(ErrorCode.FILE_UPLOAD_FAILED);
		}

//		return amazonS3.getUrl(bucket, fileName).toString();
		return String.format("%s/%s/%s", publicMinioBaseUrl, bucket, fileName);
	}

	// 파일명을 난수화하기 위해 UUID 를 활용하여 난수를 돌린다.
	public String createFileName(String fileName) {
		return UUID.randomUUID().toString().concat(getFileExtension(fileName));
	}

	//  "."의 존재 유무만 판단
	private String getFileExtension(String fileName) {
		try {
			return fileName.substring(fileName.lastIndexOf("."));
		} catch (StringIndexOutOfBoundsException e) {
			throw new CustomException(ErrorCode.INVALID_FILE_EXTENSION);
		}
	}

	public void deleteFile(String fileName) {
		storage().delete(bucket, fileName);
	}

	public void deleteFileByUrl(String fileUrl) {
		String key = extractKeyFromUrl(fileUrl);
		deleteFile(key);
	}

	private String extractKeyFromUrl(String url) {
		// "버킷명/" 을 찾아 그 뒤를 key로 사용
		int idx = url.indexOf("/" + bucket + "/");
		if (idx >= 0) {
			return url.substring(idx + bucket.length() + 2);
		}

		return url.substring(url.lastIndexOf('/') + 1);
	}
}
