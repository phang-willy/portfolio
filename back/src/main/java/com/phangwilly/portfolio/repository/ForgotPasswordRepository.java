package com.phangwilly.portfolio.repository;

import com.phangwilly.portfolio.model.ForgotPassword;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ForgotPasswordRepository extends JpaRepository<ForgotPassword, UUID> {

  Optional<ForgotPassword> findByTokenHash(String tokenHash);
}
