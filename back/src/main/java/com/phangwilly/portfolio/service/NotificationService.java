package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.dto.NotificationResponse;
import com.phangwilly.portfolio.dto.NotificationUnreadCountResponse;
import com.phangwilly.portfolio.dto.PageResponse;
import com.phangwilly.portfolio.dto.PaginationRequest;
import com.phangwilly.portfolio.event.NotificationCreatedEvent;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.model.Notification;
import com.phangwilly.portfolio.model.NotificationRead;
import com.phangwilly.portfolio.model.NotificationReadId;
import com.phangwilly.portfolio.model.ServiceHealthCheck;
import com.phangwilly.portfolio.repository.NotificationReadRepository;
import com.phangwilly.portfolio.repository.NotificationRepository;
import com.phangwilly.portfolio.security.AuthenticatedUser;
import com.phangwilly.portfolio.security.CurrentUserService;
import java.time.Clock;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

  private static final Sort DEFAULT_SORT = Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));

  private final NotificationRepository notificationRepository;
  private final NotificationReadRepository readRepository;
  private final CurrentUserService currentUserService;
  private final ApplicationEventPublisher eventPublisher;
  private final Clock clock;

  public NotificationService(
    NotificationRepository notificationRepository,
    NotificationReadRepository readRepository,
    CurrentUserService currentUserService,
    ApplicationEventPublisher eventPublisher,
    Clock clock
  ) {
    this.notificationRepository = notificationRepository;
    this.readRepository = readRepository;
    this.currentUserService = currentUserService;
    this.eventPublisher = eventPublisher;
    this.clock = clock;
  }

  @Transactional
  public void notifyDown(ServiceHealthCheck check) {
    Notification notification = notificationRepository.saveAndFlush(new Notification(
      check.code(),
      title(check),
      message(check),
      Instant.now(clock)
    ));
    eventPublisher.publishEvent(new NotificationCreatedEvent(NotificationResponse.from(notification, false)));
  }

  public NotificationResponse unsaved(ServiceHealthCheck check) {
    return new NotificationResponse(
      UUID.randomUUID(),
      check.code(),
      title(check),
      message(check),
      check.checkedAt(),
      false
    );
  }

  @Transactional(readOnly = true)
  public PageResponse<NotificationResponse> list(Integer page, Integer size) {
    AuthenticatedUser user = currentUserService.requireAdmin();
    var notifications = notificationRepository.findAll(PaginationRequest.of(page, size).toPageable(DEFAULT_SORT));
    Set<UUID> readIds = readIds(user.id(), notifications.getContent());
    return PageResponse.from(notifications.map(item -> NotificationResponse.from(item, readIds.contains(item.getId()))));
  }

  @Transactional(readOnly = true)
  public NotificationUnreadCountResponse unreadCount() {
    AuthenticatedUser user = currentUserService.requireAdmin();
    return new NotificationUnreadCountResponse(notificationRepository.countUnread(user.id()));
  }

  @Transactional
  public NotificationResponse markRead(UUID id) {
    AuthenticatedUser user = currentUserService.requireAdmin();
    Notification notification = notificationRepository.findById(id).orElseThrow(NotificationService::notFound);
    NotificationReadId readId = new NotificationReadId(id, user.id());
    if (!readRepository.existsById(readId)) {
      readRepository.save(new NotificationRead(readId, Instant.now(clock)));
    }
    return NotificationResponse.from(notification, true);
  }

  private Set<UUID> readIds(UUID userId, List<Notification> notifications) {
    if (notifications.isEmpty()) {
      return Set.of();
    }
    List<UUID> ids = notifications.stream().map(Notification::getId).toList();
    return new HashSet<>(readRepository.findReadNotificationIds(userId, ids));
  }

  private static String title(ServiceHealthCheck check) {
    return check.service() + " is down";
  }

  private static String message(ServiceHealthCheck check) {
    return check.service() + " (" + check.endpoint() + ") is not responding.";
  }

  private static ApiException notFound() {
    return new ApiException(HttpStatus.NOT_FOUND, "NOTIFICATION_NOT_FOUND", "Notification not found");
  }
}
