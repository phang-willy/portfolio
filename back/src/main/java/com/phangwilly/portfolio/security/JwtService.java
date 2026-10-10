package com.phangwilly.portfolio.security;

import com.phangwilly.portfolio.config.AuthProperties;
import com.phangwilly.portfolio.enums.UserRole;
import com.phangwilly.portfolio.model.User;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@Service
public class JwtService {

  private static final String HMAC_ALGORITHM = "HmacSHA256";
  private static final String JWT_ALGORITHM = "HS256";
  private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
  };

  private final AuthProperties properties;
  private final ObjectMapper objectMapper;

  public JwtService(AuthProperties properties, ObjectMapper objectMapper) {
    this.properties = properties;
    this.objectMapper = objectMapper;
  }

  public String generateToken(User user, Instant expiresAt) {
    Map<String, Object> header = new LinkedHashMap<>();
    header.put("typ", "JWT");
    header.put("alg", JWT_ALGORITHM);

    Instant issuedAt = Instant.now();
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("sub", user.getId().toString());
    payload.put("email", user.getEmail());
    payload.put("role", user.getRole().name());
    payload.put("iat", issuedAt.getEpochSecond());
    payload.put("exp", expiresAt.getEpochSecond());

    String encodedHeader = encodeJson(header);
    String encodedPayload = encodeJson(payload);
    String signingInput = encodedHeader + "." + encodedPayload;

    return signingInput + "." + sign(signingInput);
  }

  public Optional<JwtPayload> parseAndValidate(String token, Instant now) {
    return parseToken(token).filter(payload -> payload.expiresAt().isAfter(now));
  }

  public Optional<JwtPayload> parseAndValidateSignature(String token) {
    return parseToken(token);
  }

  private Optional<JwtPayload> parseToken(String token) {
    try {
      String[] parts = token.split("\\.");
      if (parts.length != 3) {
        return Optional.empty();
      }

      String signingInput = parts[0] + "." + parts[1];
      String expectedSignature = sign(signingInput);
      if (!MessageDigest.isEqual(
        expectedSignature.getBytes(StandardCharsets.UTF_8),
        parts[2].getBytes(StandardCharsets.UTF_8)
      )) {
        return Optional.empty();
      }

      Map<String, Object> header = decodeJson(parts[0]);
      if (!JWT_ALGORITHM.equals(header.get("alg"))) {
        return Optional.empty();
      }

      Map<String, Object> payload = decodeJson(parts[1]);
      Instant expiresAt = Instant.ofEpochSecond(readLong(payload, "exp"));

      return Optional.of(new JwtPayload(
        UUID.fromString(String.valueOf(payload.get("sub"))),
        String.valueOf(payload.get("email")),
        UserRole.valueOf(String.valueOf(payload.get("role"))),
        expiresAt
      ));
    } catch (IllegalArgumentException | IllegalStateException exception) {
      return Optional.empty();
    }
  }

  private String encodeJson(Map<String, Object> value) {
    try {
      return Base64
        .getUrlEncoder()
        .withoutPadding()
        .encodeToString(objectMapper.writeValueAsBytes(value));
    } catch (JacksonException exception) {
      throw new IllegalStateException("Unable to encode JWT", exception);
    }
  }

  private Map<String, Object> decodeJson(String encodedValue) {
    try {
      byte[] decoded = Base64.getUrlDecoder().decode(encodedValue);
      return objectMapper.readValue(decoded, MAP_TYPE);
    } catch (JacksonException | IllegalArgumentException exception) {
      throw new IllegalArgumentException("Unable to decode JWT", exception);
    }
  }

  private String sign(String signingInput) {
    try {
      Mac mac = Mac.getInstance(HMAC_ALGORITHM);
      mac.init(new SecretKeySpec(
        properties.getJwtSecret().getBytes(StandardCharsets.UTF_8),
        HMAC_ALGORITHM
      ));
      return Base64
        .getUrlEncoder()
        .withoutPadding()
        .encodeToString(mac.doFinal(signingInput.getBytes(StandardCharsets.UTF_8)));
    } catch (GeneralSecurityException exception) {
      throw new IllegalStateException("Unable to sign JWT", exception);
    }
  }

  private static long readLong(Map<String, Object> payload, String key) {
    Object value = payload.get(key);
    if (value instanceof Number number) {
      return number.longValue();
    }
    return Long.parseLong(String.valueOf(value));
  }
}
