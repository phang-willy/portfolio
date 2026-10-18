package com.phangwilly.portfolio.repository;

import com.phangwilly.portfolio.model.TwoFactorAuth;
import com.phangwilly.portfolio.model.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TwoFactorAuthRepository extends JpaRepository<TwoFactorAuth, UUID> {

  Optional<TwoFactorAuth> findFirstByUserAndCodeHashAndVerifiedAtIsNullOrderByCreatedAtDesc(
    User user,
    String codeHash
  );
}
