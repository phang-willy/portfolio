package com.phangwilly.portfolio.security;

import com.phangwilly.portfolio.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

  private static final String UNAUTHENTICATED_CODE = "UNAUTHENTICATED";
  private static final String UNAUTHENTICATED_MESSAGE = "Authentication is required";

  public AuthenticatedUser getCurrentUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

    if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        UNAUTHENTICATED_CODE,
        UNAUTHENTICATED_MESSAGE
      );
    }

    return user;
  }
}
