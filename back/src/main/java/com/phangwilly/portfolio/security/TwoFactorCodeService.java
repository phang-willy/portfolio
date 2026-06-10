package com.phangwilly.portfolio.security;

import java.security.SecureRandom;
import org.springframework.stereotype.Service;

@Service
public class TwoFactorCodeService {

  private static final int CODE_BOUND = 1_000_000;

  private final SecureRandom secureRandom = new SecureRandom();

  public String generateCode() {
    return "%06d".formatted(secureRandom.nextInt(CODE_BOUND));
  }
}
