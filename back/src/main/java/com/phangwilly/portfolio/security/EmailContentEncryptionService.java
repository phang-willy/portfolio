package com.phangwilly.portfolio.security;

import com.phangwilly.portfolio.config.AuthProperties;
import java.security.GeneralSecurityException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

@Service
public class EmailContentEncryptionService {

  private static final String PREFIX = "enc:v1:";
  private static final String CIPHER_ALGORITHM = "AES/GCM/NoPadding";
  private static final String KEY_ALGORITHM = "AES";
  private static final int IV_BYTE_LENGTH = 12;
  private static final int TAG_BIT_LENGTH = 128;

  private final AuthProperties authProperties;
  private final SecureRandom secureRandom = new SecureRandom();

  public EmailContentEncryptionService(AuthProperties authProperties) {
    this.authProperties = authProperties;
  }

  public String encrypt(String plainText) {
    try {
      byte[] iv = new byte[IV_BYTE_LENGTH];
      secureRandom.nextBytes(iv);
      Cipher cipher = Cipher.getInstance(CIPHER_ALGORITHM);
      cipher.init(
        Cipher.ENCRYPT_MODE,
        new SecretKeySpec(resolveKey(), KEY_ALGORITHM),
        new GCMParameterSpec(TAG_BIT_LENGTH, iv)
      );
      byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

      return PREFIX
        + Base64.getUrlEncoder().withoutPadding().encodeToString(iv)
        + ":"
        + Base64.getUrlEncoder().withoutPadding().encodeToString(encrypted);
    } catch (GeneralSecurityException exception) {
      throw new IllegalStateException("Unable to encrypt email content", exception);
    }
  }

  public String decrypt(String protectedBody) {
    if (protectedBody == null || !protectedBody.startsWith(PREFIX)) {
      return protectedBody;
    }

    try {
      String protectedPayload = protectedBody.substring(PREFIX.length());
      String[] parts = protectedPayload.split(":");
      if (parts.length != 2) {
        throw new IllegalArgumentException("Invalid protected email body");
      }

      byte[] iv = Base64.getUrlDecoder().decode(parts[0]);
      byte[] encrypted = Base64.getUrlDecoder().decode(parts[1]);
      Cipher cipher = Cipher.getInstance(CIPHER_ALGORITHM);
      cipher.init(
        Cipher.DECRYPT_MODE,
        new SecretKeySpec(resolveKey(), KEY_ALGORITHM),
        new GCMParameterSpec(TAG_BIT_LENGTH, iv)
      );

      return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
    } catch (GeneralSecurityException | IllegalArgumentException exception) {
      throw new IllegalStateException("Unable to decrypt email content", exception);
    }
  }

  private byte[] resolveKey() {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      return digest.digest(
        (authProperties.getTokenHashSecret() + ":email-content")
          .getBytes(StandardCharsets.UTF_8)
      );
    } catch (GeneralSecurityException exception) {
      throw new IllegalStateException("Unable to derive email encryption key", exception);
    }
  }
}
