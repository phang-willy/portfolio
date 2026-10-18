package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.model.ServiceHealthCheck;
import com.phangwilly.portfolio.model.ServiceHealthState;
import com.phangwilly.portfolio.repository.ServiceHealthStateRepository;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ServiceHealthStateService {

  private final ServiceHealthStateRepository repository;

  public ServiceHealthStateService(ServiceHealthStateRepository repository) {
    this.repository = repository;
  }

  @Transactional(readOnly = true)
  public Map<String, String> load() {
    Map<String, String> statuses = new HashMap<>();
    for (ServiceHealthState state : repository.findAll()) {
      statuses.put(state.getCode(), state.getStatus());
    }
    return statuses;
  }

  @Transactional
  public void save(List<ServiceHealthCheck> checks) {
    Map<String, ServiceHealthState> existing = new HashMap<>();
    for (ServiceHealthState state : repository.findAll()) {
      existing.put(state.getCode(), state);
    }
    Set<String> seen = new HashSet<>();
    for (ServiceHealthCheck check : checks) {
      seen.add(check.code());
      ServiceHealthState state = existing.get(check.code());
      if (state == null) {
        repository.save(new ServiceHealthState(check.code(), check.status(), check.checkedAt()));
      } else {
        state.update(check.status(), check.checkedAt());
      }
    }
    for (ServiceHealthState state : existing.values()) {
      if (!seen.contains(state.getCode())) {
        repository.delete(state);
      }
    }
  }
}
