package com.phangwilly.portfolio.repository;

import com.phangwilly.portfolio.model.Stack;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StackRepository extends JpaRepository<Stack, UUID> {
}
