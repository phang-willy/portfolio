package com.phangwilly.portfolio.dto;

import java.time.Instant;

public record AuthTokenResponse(String token, Instant expiredAt) {
}
