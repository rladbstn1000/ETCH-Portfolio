package com.ssafy.etch.global.service;

import java.io.InputStream;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

/** Included in the normal/full artifact only; preserves the team's existing S3 operations. */
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.features.storage-enabled", havingValue = "true", matchIfMissing = true)
public class AwsS3StorageClient implements StorageClient {
    private final S3Client client;

    @Override
    public void put(String bucket, String key, InputStream input, long length, String contentType) {
        client.putObject(PutObjectRequest.builder().bucket(bucket).key(key)
            .contentLength(length).contentType(contentType).acl(ObjectCannedACL.PUBLIC_READ).build(),
            RequestBody.fromInputStream(input, length));
    }

    @Override
    public void delete(String bucket, String key) {
        client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
    }
}
