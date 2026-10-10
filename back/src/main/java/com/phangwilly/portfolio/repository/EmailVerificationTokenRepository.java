package com.phangwilly.portfolio.repository;

import com.phangwilly.portfolio.model.EmailVerificationToken;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmailVerificationTokenRepository
  extends JpaRepository<EmailVerificationToken, UUID> {

  Optional<EmailVerificationToken> findByTokenHash(String tokenHash);

  @Modifying(flushAutomatically = true)
  @Query("""
    update EmailVerificationToken token
    set token.consumedAt = :consumedAt
    where token.user.id = :userId
      and token.consumedAt is null
    """)
  int consumeOpenTokens(@Param("userId") UUID userId, @Param("consumedAt") Instant consumedAt);
}
