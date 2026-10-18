package com.phangwilly.portfolio.security;

import com.phangwilly.portfolio.config.AuthProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Optional;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

@Service
public class AuthCookieService {

  private final AuthProperties authProperties;
  private final Clock clock;

  public AuthCookieService(AuthProperties authProperties, Clock clock) {
    this.authProperties = authProperties;
    this.clock = clock;
  }

  public Optional<String> resolveToken(HttpServletRequest request) {
    Cookie[] cookies = request.getCookies();
    if (cookies == null) {
      return Optional.empty();
    }

    return Arrays
      .stream(cookies)
      .filter(cookie -> authProperties.getCookieName().equals(cookie.getName()))
      .map(Cookie::getValue)
      .filter(value -> value != null && !value.isBlank())
      .findFirst();
  }

  public void addSessionCookie(HttpServletResponse response, String token, Instant expiredAt) {
    Duration maxAge = Duration.between(Instant.now(clock), expiredAt);
    ResponseCookie cookie = baseCookie(token)
      .maxAge(maxAge.isNegative() ? Duration.ZERO : maxAge)
      .build();

    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
  }

  public void clearSessionCookie(HttpServletResponse response) {
    ResponseCookie cookie = baseCookie("")
      .maxAge(Duration.ZERO)
      .build();

    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
  }

  private ResponseCookie.ResponseCookieBuilder baseCookie(String value) {
    return ResponseCookie
      .from(authProperties.getCookieName(), value)
      .httpOnly(true)
      .secure(authProperties.isCookieSecure())
      .sameSite(authProperties.getCookieSameSite())
      .path(authProperties.getCookiePath());
  }
}
