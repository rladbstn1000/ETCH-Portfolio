package com.ssafy.etch.global.config;

import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
@ConditionalOnProperty(name = "app.features.storage-enabled", havingValue = "true", matchIfMissing = true)
public class S3Config {
    @Bean
    public S3Client s3Client(@Value("${cloud.aws.credentials.access-key}") String accessKey,
                           @Value("${cloud.aws.credentials.secret-key}") String secretKey,
                           @Value("${cloud.aws.region.static}") String region,
                           @Value("${cloud.aws.s3.endpoint}") String endpoint) {
        return S3Client.builder()
            .endpointOverride(URI.create(endpoint))
            .region(Region.of(region))
            .forcePathStyle(true)
            .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
            .httpClientBuilder(UrlConnectionHttpClient.builder())
            .build();
    }
}
