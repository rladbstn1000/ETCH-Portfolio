package com.ssafy.etch.global.service;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import java.io.ByteArrayInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class AwsS3StorageClientTest {
    @Test void fullArtifactPreservesVendorUploadAndDeleteContract() {
        S3Client sdk = mock(S3Client.class);
        new ApplicationContextRunner().withUserConfiguration(AwsS3StorageClient.class)
            .withPropertyValues("app.features.storage-enabled=true")
            .withBean(S3Client.class, () -> sdk).run(app -> {
                assertThat(app).hasNotFailed().hasSingleBean(StorageClient.class);
                StorageClient storage = app.getBean(StorageClient.class);
                ByteArrayInputStream content = new ByteArrayInputStream(new byte[] {1, 2, 3});
                storage.put("synthetic-bucket", "key.txt", content, 3, "text/plain");
                ArgumentCaptor<PutObjectRequest> upload = ArgumentCaptor.forClass(PutObjectRequest.class);
                ArgumentCaptor<RequestBody> body = ArgumentCaptor.forClass(RequestBody.class);
                verify(sdk).putObject(upload.capture(), body.capture());
                assertThat(upload.getValue().bucket()).isEqualTo("synthetic-bucket");
                assertThat(upload.getValue().key()).isEqualTo("key.txt");
                assertThat(body.getValue().contentStreamProvider().newStream().readAllBytes()).containsExactly(1, 2, 3);
                assertThat(upload.getValue().contentLength()).isEqualTo(3);
                assertThat(upload.getValue().contentType()).isEqualTo("text/plain");
                assertThat(upload.getValue().acl()).isEqualTo(ObjectCannedACL.PUBLIC_READ);
                storage.delete("synthetic-bucket", "key.txt");
                ArgumentCaptor<DeleteObjectRequest> deletion = ArgumentCaptor.forClass(DeleteObjectRequest.class);
                verify(sdk).deleteObject(deletion.capture());
                assertThat(deletion.getValue().bucket()).isEqualTo("synthetic-bucket");
                assertThat(deletion.getValue().key()).isEqualTo("key.txt");
            });
    }

    @Test void fullConfigurationKeepsExplicitEndpointAndCredentialsWithoutNetwork() {
        new ApplicationContextRunner().withUserConfiguration(com.ssafy.etch.global.config.S3Config.class)
            .withPropertyValues("app.features.storage-enabled=true",
                "cloud.aws.credentials.access-key=synthetic-access", "cloud.aws.credentials.secret-key=synthetic-secret",
                "cloud.aws.region.static=us-east-1", "cloud.aws.s3.endpoint=http://127.0.0.1:1")
            .run(app -> {
                assertThat(app).hasNotFailed().hasSingleBean(S3Client.class);
                var config = app.getBean(S3Client.class).serviceClientConfiguration();
                assertThat(config.endpointOverride()).contains(java.net.URI.create("http://127.0.0.1:1"));
                assertThat(config.region().id()).isEqualTo("us-east-1");
                assertThat(config.credentialsProvider()).isInstanceOf(software.amazon.awssdk.auth.credentials.StaticCredentialsProvider.class);
            });
    }

    @Test void disabledNormalFeatureDoesNotRequireVendorClient() {
        new ApplicationContextRunner().withUserConfiguration(AwsS3StorageClient.class)
            .withPropertyValues("app.features.storage-enabled=false").run(app ->
                assertThat(app).hasNotFailed().doesNotHaveBean(StorageClient.class));
    }
}
