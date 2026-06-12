package com.phangwilly.portfolio.security;

import com.phangwilly.portfolio.enums.UserRole;
import com.phangwilly.portfolio.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

  private static final String UNAUTHENTICATED_CODE = "UNAUTHENTICATED";
  private static final String UNAUTHENTICATED_MESSAGE = "Authentication is required";
  private static final String ACCESS_DENIED_CODE = "ACCESS_DENIED";
  private static final String ACCESS_DENIED_MESSAGE = "Access denied";

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

  public AuthenticatedUser requireAdmin() {
    AuthenticatedUser user = getCurrentUser();

    if (user.role() != UserRole.ADMIN) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ACCESS_DENIED_CODE,
        ACCESS_DENIED_MESSAGE
      );
    }

    return user;
  }
}
