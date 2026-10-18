package com.phangwilly.portfolio.dto;

import java.time.Instant;
import java.util.UUID;

public record ContactPresenceViewer(UUID userId, String name, Instant joinedAt) {}
