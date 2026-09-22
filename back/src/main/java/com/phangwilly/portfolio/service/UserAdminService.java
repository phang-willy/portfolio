package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.dto.EmailAvailabilityResponse;
import com.phangwilly.portfolio.dto.PageResponse;
import com.phangwilly.portfolio.dto.PaginationRequest;
import com.phangwilly.portfolio.dto.UserAdminDetail;
import com.phangwilly.portfolio.dto.UserAdminListItem;
import com.phangwilly.portfolio.dto.UserAdminUpdateRequest;
import com.phangwilly.portfolio.dto.UserHistoryEntry;
import com.phangwilly.portfolio.enums.UserHistoryType;
import com.phangwilly.portfolio.enums.UserRole;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.model.User;
import com.phangwilly.portfolio.repository.EmailVerificationTokenRepository;
import com.phangwilly.portfolio.repository.UserHistoryRepository;
import com.phangwilly.portfolio.repository.UserRepository;
import com.phangwilly.portfolio.repository.UserSessionRepository;
import com.phangwilly.portfolio.security.AuthenticatedUser;
import com.phangwilly.portfolio.security.CurrentUserService;
import com.phangwilly.portfolio.util.PersonNameFormatter;
import java.time.Clock;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserAdminService {

  private static final Sort DEFAULT_SORT = Sort
    .by(Sort.Direction.DESC, "createdAt")
    .and(Sort.by(Sort.Direction.DESC, "id"));
  private static final String NOT_FOUND_CODE = "USER_NOT_FOUND";
  private static final String NOT_FOUND_MESSAGE = "User not found";
  private static final String HIERARCHY_CODE = "HIERARCHY_DENIED";
  private static final String HIERARCHY_MESSAGE = "You can only manage accounts below your role";
  private static final String ROLE_CODE = "ROLE_NOT_ASSIGNABLE";
  private static final String ROLE_MESSAGE = "You can only assign a role below your own";
  private static final String EMAIL_CODE = "EMAIL_ALREADY_EXISTS";
  private static final String EMAIL_MESSAGE = "Email already exists";
  private static final String EMAIL_CONFIRM_CODE = "EMAIL_CHANGE_UNCONFIRMED";
  private static final String EMAIL_CONFIRM_MESSAGE = "Confirm the email change before saving";
  private static final String INVALID_EMAIL_CODE = "INVALID_EMAIL";
  private static final String INVALID_EMAIL_MESSAGE = "Enter a valid email";
  private static final String FORGOT_PASSWORD_DETAIL = "User page";

  private final CurrentUserService currentUserService;
  private final UserRepository userRepository;
  private final UserHistoryRepository userHistoryRepository;
  private final UserHistoryService userHistoryService;
  private final UserSessionRepository userSessionRepository;
  private final EmailVerificationTokenRepository emailVerificationTokenRepository;
  private final AuthService authService;
  private final Clock clock;

  public UserAdminService(
    CurrentUserService currentUserService,
    UserRepository userRepository,
    UserHistoryRepository userHistoryRepository,
    UserHistoryService userHistoryService,
    UserSessionRepository userSessionRepository,
    EmailVerificationTokenRepository emailVerificationTokenRepository,
    AuthService authService,
    Clock clock
  ) {
    this.currentUserService = currentUserService;
    this.userRepository = userRepository;
    this.userHistoryRepository = userHistoryRepository;
    this.userHistoryService = userHistoryService;
    this.userSessionRepository = userSessionRepository;
    this.emailVerificationTokenRepository = emailVerificationTokenRepository;
    this.authService = authService;
    this.clock = clock;
  }

  @Transactional(readOnly = true)
  public PageResponse<UserAdminListItem> getUsers(Integer page, Integer size) {
    currentUserService.requireAdmin();
    PaginationRequest paginationRequest = PaginationRequest.of(page, size);

    return PageResponse.from(
      userRepository
        .findAll(paginationRequest.toPageable(DEFAULT_SORT))
        .map(UserAdminListItem::from)
    );
  }

  @Transactional(readOnly = true)
  public UserAdminDetail getUser(UUID id) {
    AuthenticatedUser actor = currentUserService.requireAdmin();
    return toDetail(findUser(id), actor);
  }

  @Transactional(readOnly = true)
  public EmailAvailabilityResponse emailAvailable(String email, UUID userId) {
    AuthenticatedUser actor = currentUserService.requireAdmin();
    ensureCanManage(actor, findUser(userId));
    String normalized = normalizeEmail(email);
    if (!isPlausibleEmail(normalized)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, INVALID_EMAIL_CODE, INVALID_EMAIL_MESSAGE);
    }

    boolean available = !userRepository.existsByEmailIgnoreCaseAndIdNot(normalized, userId);
    return new EmailAvailabilityResponse(available);
  }

  @Transactional
  public UserAdminDetail update(UUID id, UserAdminUpdateRequest request) {
    AuthenticatedUser actor = currentUserService.requireAdmin();
    User user = findUser(id);
    ensureCanManage(actor, user);

    String lastname = PersonNameFormatter.formatLastname(request.lastname());
    String firstname = PersonNameFormatter.formatFirstname(request.firstname());
    UserRole role = request.role();
    boolean active = Boolean.TRUE.equals(request.active());
    String email = normalizeEmail(request.email());

    if (!actor.role().outranks(role)) {
      throw new ApiException(HttpStatus.FORBIDDEN, ROLE_CODE, ROLE_MESSAGE);
    }

    boolean emailChanged = !email.equalsIgnoreCase(user.getEmail());
    if (emailChanged && !request.confirmEmailChange()) {
      throw new ApiException(HttpStatus.CONFLICT, EMAIL_CONFIRM_CODE, EMAIL_CONFIRM_MESSAGE);
    }

    if (emailChanged && userRepository.existsByEmailIgnoreCaseAndIdNot(email, user.getId())) {
      throw new ApiException(HttpStatus.CONFLICT, EMAIL_CODE, EMAIL_MESSAGE);
    }

    boolean nameChanged = !lastname.equals(user.getLastname()) || !firstname.equals(user.getFirstname());
    boolean roleChanged = role != user.getRole();
    boolean activeChanged = active != user.isActive();
    String previousName = UserHistoryService.displayName(user);
    String previousEmail = user.getEmail();
    UserRole previousRole = user.getRole();
    Instant now = Instant.now(clock);

    if (nameChanged) {
      user.rename(lastname, firstname);
    }

    if (roleChanged) {
      user.changeRole(role);
    }

    if (activeChanged) {
      if (active) {
        user.activate();
      } else {
        user.deactivate(now);
      }
    }

    if (emailChanged) {
      user.changeEmail(email);
    }

    if (nameChanged) {
      userHistoryService.record(
        user,
        UserHistoryType.PROFILE_UPDATED,
        actor,
        previousName + " -> " + UserHistoryService.displayName(user)
      );
    }

    if (roleChanged) {
      userHistoryService.record(
        user,
        UserHistoryType.ROLE_CHANGED,
        actor,
        previousRole.name() + " -> " + role.name()
      );
    }

    if (activeChanged) {
      userHistoryService.record(
        user,
        active ? UserHistoryType.ACCOUNT_ACTIVATED : UserHistoryType.ACCOUNT_DEACTIVATED,
        actor,
        null
      );
      if (!active) {
        userSessionRepository.expireAllUserSessions(user.getId(), now);
      }
    }

    if (emailChanged) {
      emailVerificationTokenRepository.consumeOpenTokens(user.getId(), now);
      userSessionRepository.expireAllUserSessions(user.getId(), now);
      authService.queueEmailVerification(user);
      userHistoryService.record(
        user,
        UserHistoryType.EMAIL_CHANGED,
        actor,
        previousEmail + " -> " + email
      );
    }

    return toDetail(user, actor);
  }

  @Transactional
  public UserAdminDetail requestPasswordReset(UUID id) {
    AuthenticatedUser actor = currentUserService.requireAdmin();
    User user = findUser(id);
    ensureCanManage(actor, user);
    authService.queuePasswordResetEmail(user);
    userHistoryService.record(
      user,
      UserHistoryType.PASSWORD_RESET_REQUESTED,
      actor,
      FORGOT_PASSWORD_DETAIL
    );
    return toDetail(user, actor);
  }

  private UserAdminDetail toDetail(User user, AuthenticatedUser actor) {
    boolean manageable = actor.role().outranks(user.getRole());
    List<UserRole> assignableRoles = Arrays.stream(UserRole.values())
      .filter(actor.role()::outranks)
      .toList();
    List<UserHistoryEntry> history = userHistoryRepository
      .findByUser_IdAndDeletedAtIsNullOrderByCreatedAtDescIdDesc(user.getId())
      .stream()
      .map(UserHistoryEntry::from)
      .toList();

    return UserAdminDetail.from(user, manageable, assignableRoles, history);
  }

  private User findUser(UUID id) {
    return userRepository.findById(id).orElseThrow(UserAdminService::notFound);
  }

  private static void ensureCanManage(AuthenticatedUser actor, User target) {
    if (!actor.role().outranks(target.getRole())) {
      throw new ApiException(HttpStatus.FORBIDDEN, HIERARCHY_CODE, HIERARCHY_MESSAGE);
    }
  }

  private static String normalizeEmail(String email) {
    return email.trim().toLowerCase(Locale.ROOT);
  }

  private static boolean isPlausibleEmail(String email) {
    int at = email.indexOf('@');
    return at > 0 && at < email.length() - 1 && !email.contains(" ") && email.length() <= 320;
  }

  private static ApiException notFound() {
    return new ApiException(HttpStatus.NOT_FOUND, NOT_FOUND_CODE, NOT_FOUND_MESSAGE);
  }
}
