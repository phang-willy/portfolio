package com.phangwilly.portfolio.security;

import com.phangwilly.portfolio.config.AuthProperties;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.HexFormat;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

@Service
public class TokenHashService {

  private static final String HMAC_ALGORITHM = "HmacSHA256";
  private static final String TOKEN_PURPOSE = "token";
  private static final String JWT_PURPOSE = "jwt";
  private static final String TWO_FACTOR_PURPOSE = "2fa";

  private final AuthProperties properties;

  public TokenHashService(AuthProperties properties) {
    this.properties = properties;
  }

  public String hashToken(String token) {
    return hash(TOKEN_PURPOSE + ":" + token);
  }

  public String hashJwt(String jwt) {
    return hash(JWT_PURPOSE + ":" + jwt);
  }

  public String hashTwoFactorCode(UUID userId, String code) {
    return hash(TWO_FACTOR_PURPOSE + ":" + userId + ":" + code);
  }

  private String hash(String value) {
    try {
      Mac mac = Mac.getInstance(HMAC_ALGORITHM);
      mac.init(new SecretKeySpec(
        properties.getTokenHashSecret().getBytes(StandardCharsets.UTF_8),
        HMAC_ALGORITHM
      ));
      return HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
    } catch (GeneralSecurityException exception) {
      throw new IllegalStateException("Unable to hash auth value", exception);
    }
  }
}
