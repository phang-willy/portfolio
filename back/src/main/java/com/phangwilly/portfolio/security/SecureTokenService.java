package com.phangwilly.portfolio.security;

import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.stereotype.Service;

@Service
public class SecureTokenService {

  private static final int TOKEN_BYTE_LENGTH = 32;

  private final SecureRandom secureRandom = new SecureRandom();

  public String generateToken() {
    byte[] tokenBytes = new byte[TOKEN_BYTE_LENGTH];
    secureRandom.nextBytes(tokenBytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
  }
}
