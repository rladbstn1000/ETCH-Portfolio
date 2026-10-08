package com.ssafy.etch.global.service;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class StorageBoundaryTest {
    private final ApplicationContextRunner context = new ApplicationContextRunner()
        .withUserConfiguration(S3Service.class)
        .withPropertyValues("cloud.aws.s3.bucket=synthetic-bucket", "PUBLIC_MINIO_BASE_URL=https://storage.example.invalid");

    @Test void facadeStartsWithoutOptionalProviderAndFailsClosed() {
        context.run(app -> {
            assertThat(app).hasNotFailed().hasSingleBean(S3Service.class);
            S3Service facade = app.getBean(S3Service.class);
            assertThatThrownBy(() -> facade.uploadFile(new MockMultipartFile("file", "test.txt", "text/plain", new byte[0])))
                .isInstanceOfSatisfying(ResponseStatusException.class, error ->
                    assertThat(error.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
            assertThatThrownBy(() -> facade.deleteFile("key"))
                .isInstanceOfSatisfying(ResponseStatusException.class, error ->
                    assertThat(error.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
        });
    }

    @Test void normalFacadeRetainsContentMetadataPublicUrlAndDeleteKey() throws Exception {
        StorageClient provider = mock(StorageClient.class);
        AtomicReference<String> uploaded = new AtomicReference<>();
        doAnswer(call -> {
            uploaded.set(new String(((InputStream) call.getArgument(2)).readAllBytes(), StandardCharsets.UTF_8));
            return null;
        }).when(provider).put(eq("synthetic-bucket"), anyString(), any(InputStream.class), eq(9L), eq("text/plain"));
        context.withBean(StorageClient.class, () -> provider).run(app -> {
            S3Service facade = app.getBean(S3Service.class);
            String url = facade.uploadFile(new MockMultipartFile("file", "original.txt", "text/plain", "synthetic".getBytes(StandardCharsets.UTF_8)));
            assertThat(url).matches("https://storage\\.example\\.invalid/synthetic-bucket/[a-f0-9-]{36}\\.txt");
            assertThat(uploaded).hasValue("synthetic");
            String key = url.substring(url.lastIndexOf('/') + 1);
            facade.deleteFileByUrl(url);
            verify(provider).delete("synthetic-bucket", key);
        });
    }
}
