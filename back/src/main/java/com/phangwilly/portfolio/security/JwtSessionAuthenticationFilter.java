package com.phangwilly.portfolio.security;

import com.phangwilly.portfolio.model.UserSession;
import com.phangwilly.portfolio.model.User;
import com.phangwilly.portfolio.repository.UserSessionRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtSessionAuthenticationFilter extends OncePerRequestFilter {

  private static final String AUTHORIZATION_HEADER = "Authorization";
  private static final String BEARER_PREFIX = "Bearer ";
  private static final String UNAUTHENTICATED_CODE = "UNAUTHENTICATED";
  private static final String UNAUTHENTICATED_MESSAGE = "Invalid or expired authentication token";

  private final JwtService jwtService;
  private final TokenHashService tokenHashService;
  private final UserSessionRepository userSessionRepository;
  private final SecurityErrorWriter securityErrorWriter;
  private final Clock clock;

  public JwtSessionAuthenticationFilter(
    JwtService jwtService,
    TokenHashService tokenHashService,
    UserSessionRepository userSessionRepository,
    SecurityErrorWriter securityErrorWriter,
    Clock clock
  ) {
    this.jwtService = jwtService;
    this.tokenHashService = tokenHashService;
    this.userSessionRepository = userSessionRepository;
    this.securityErrorWriter = securityErrorWriter;
    this.clock = clock;
  }

  @Override
  protected void doFilterInternal(
    HttpServletRequest request,
    HttpServletResponse response,
    FilterChain filterChain
  ) throws ServletException, IOException {
    String token = resolveBearerToken(request);
    if (token == null) {
      filterChain.doFilter(request, response);
      return;
    }

    Instant now = Instant.now(clock);
    String tokenHash = tokenHashService.hashJwt(token);
    JwtPayload payload = jwtService.parseAndValidate(token, now).orElse(null);
    UserSession session = userSessionRepository.findByTokenHash(tokenHash).orElse(null);

    if (payload == null || session == null || !session.isValid(now) || !session.getUser().isActive()) {
      SecurityContextHolder.clearContext();
      securityErrorWriter.write(
        response,
        HttpStatus.UNAUTHORIZED,
        UNAUTHENTICATED_CODE,
        UNAUTHENTICATED_MESSAGE
      );
      return;
    }

    User sessionUser = session.getUser();
    if (!sessionUser.getId().equals(payload.userId())) {
      SecurityContextHolder.clearContext();
      securityErrorWriter.write(
        response,
        HttpStatus.UNAUTHORIZED,
        UNAUTHENTICATED_CODE,
        UNAUTHENTICATED_MESSAGE
      );
      return;
    }

    AuthenticatedUser principal = new AuthenticatedUser(
      sessionUser.getId(),
      sessionUser.getEmail(),
      sessionUser.getRole(),
      tokenHash
    );
    UsernamePasswordAuthenticationToken authentication =
      new UsernamePasswordAuthenticationToken(
        principal,
        null,
        List.of(new SimpleGrantedAuthority("ROLE_" + sessionUser.getRole().name()))
      );
    SecurityContextHolder.getContext().setAuthentication(authentication);

    filterChain.doFilter(request, response);
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    return PublicSecurityPaths.shouldSkipJwtFilter(request);
  }

  private static String resolveBearerToken(HttpServletRequest request) {
    String authorization = request.getHeader(AUTHORIZATION_HEADER);
    if (authorization == null || !authorization.startsWith(BEARER_PREFIX)) {
      return null;
    }
    String token = authorization.substring(BEARER_PREFIX.length()).trim();
    return token.isBlank() ? null : token;
  }
}
