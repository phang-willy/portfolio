package com.phangwilly.portfolio.dto;

import java.util.List;

public record ServiceHealthSnapshotResponse(List<ServiceHealthCheckResponse> checks) {
}
