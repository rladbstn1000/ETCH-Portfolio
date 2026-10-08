package com.ssafy.etch.global.service;

import java.io.InputStream;

/** Storage boundary with no vendor classes, also safe to load without the optional SDK. */
public interface StorageClient {
    void put(String bucket, String key, InputStream input, long length, String contentType);
    void delete(String bucket, String key);
}
