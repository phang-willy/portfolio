package com.phangwilly.portfolio.security;

public record RateLimitKey(String bucketKey, int requestsPerSecond) {
}
