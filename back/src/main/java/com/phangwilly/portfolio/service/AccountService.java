package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.dto.AuthMessageResponse;
import com.phangwilly.portfolio.dto.ChangePasswordRequest;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.model.User;
import com.phangwilly.portfolio.model.UserPassword;
import com.phangwilly.portfolio.repository.UserPasswordRepository;
import com.phangwilly.portfolio.repository.UserRepository;
import com.phangwilly.portfolio.repository.UserSessionRepository;
import com.phangwilly.portfolio.security.AuthenticatedUser;
import com.phangwilly.portfolio.security.CurrentUserService;
import java.time.Clock;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {

  private static final String PASSWORD_CHANGED_MESSAGE = "Password changed";
  private static final String PASSWORD_MISMATCH_CODE = "PASSWORD_MISMATCH";
  private static final String PASSWORD_MISMATCH_MESSAGE = "Passwords do not match";
  private static final String INVALID_OLD_PASSWORD_CODE = "INVALID_OLD_PASSWORD";
  private static final String INVALID_OLD_PASSWORD_MESSAGE = "Old password is invalid";
  private static final String USER_NOT_FOUND_CODE = "USER_NOT_FOUND";
  private static final String USER_NOT_FOUND_MESSAGE = "User not found";

  private final CurrentUserService currentUserService;
  private final UserRepository userRepository;
  private final UserPasswordRepository userPasswordRepository;
  private final UserSessionRepository userSessionRepository;
  private final PasswordEncoder passwordEncoder;
  private final Clock clock;

  public AccountService(
    CurrentUserService currentUserService,
    UserRepository userRepository,
    UserPasswordRepository userPasswordRepository,
    UserSessionRepository userSessionRepository,
    PasswordEncoder passwordEncoder,
    Clock clock
  ) {
    this.currentUserService = currentUserService;
    this.userRepository = userRepository;
    this.userPasswordRepository = userPasswordRepository;
    this.userSessionRepository = userSessionRepository;
    this.passwordEncoder = passwordEncoder;
    this.clock = clock;
  }

  @Transactional
  public AuthMessageResponse changePassword(ChangePasswordRequest request) {
    if (!request.newPassword().equals(request.confirmPassword())) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        PASSWORD_MISMATCH_CODE,
        PASSWORD_MISMATCH_MESSAGE
      );
    }

    AuthenticatedUser currentUser = currentUserService.getCurrentUser();
    User user = userRepository
      .findById(currentUser.id())
      .orElseThrow(() -> new ApiException(
        HttpStatus.UNAUTHORIZED,
        USER_NOT_FOUND_CODE,
        USER_NOT_FOUND_MESSAGE
      ));
    UserPassword password = userPasswordRepository
      .findByUser(user)
      .orElseThrow(() -> new ApiException(
        HttpStatus.UNAUTHORIZED,
        USER_NOT_FOUND_CODE,
        USER_NOT_FOUND_MESSAGE
      ));

    if (!passwordEncoder.matches(request.oldPassword(), password.getPasswordHash())) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        INVALID_OLD_PASSWORD_CODE,
        INVALID_OLD_PASSWORD_MESSAGE
      );
    }

    password.updatePasswordHash(passwordEncoder.encode(request.newPassword()));
    userSessionRepository.expireOtherSessions(
      currentUser.id(),
      currentUser.tokenHash(),
      Instant.now(clock)
    );

    return new AuthMessageResponse(PASSWORD_CHANGED_MESSAGE);
  }
}
