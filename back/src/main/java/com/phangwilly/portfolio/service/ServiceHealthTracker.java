package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.model.ServiceHealthCheck;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public final class ServiceHealthTracker {

  private final Map<String, String> statusByCode = new ConcurrentHashMap<>();

  public void restore(Map<String, String> persisted) {
    statusByCode.clear();
    if (persisted == null) {
      return;
    }
    persisted.forEach((code, status) -> {
      if (code != null && status != null) {
        statusByCode.put(code, status);
      }
    });
  }

  public List<ServiceHealthCheck> record(List<ServiceHealthCheck> checks) {
    List<ServiceHealthCheck> failures = new ArrayList<>();
    Set<String> seen = new HashSet<>();
    for (ServiceHealthCheck check : checks) {
      seen.add(check.code());
      String previous = statusByCode.put(check.code(), check.status());
      if (check.down() && !ServiceHealthCheck.DOWN.equals(previous)) {
        failures.add(check);
      }
    }
    statusByCode.keySet().retainAll(seen);
    return List.copyOf(failures);
  }

  public void recordRecoveries(List<ServiceHealthCheck> checks) {
    for (ServiceHealthCheck check : checks) {
      if (!check.down()) {
        statusByCode.put(check.code(), check.status());
      }
    }
  }
}
