package com.phangwilly.portfolio.repository;

import com.phangwilly.portfolio.model.ServiceHealthState;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceHealthStateRepository extends JpaRepository<ServiceHealthState, String> {
}
