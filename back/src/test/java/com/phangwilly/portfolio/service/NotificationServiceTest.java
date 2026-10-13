package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.dto.NotificationResponse;
import com.phangwilly.portfolio.enums.UserRole;
import com.phangwilly.portfolio.model.Notification;
import com.phangwilly.portfolio.model.UuidPrimaryKeyEntity;
import com.phangwilly.portfolio.repository.NotificationReadRepository;
import com.phangwilly.portfolio.repository.NotificationRepository;
import com.phangwilly.portfolio.security.AuthenticatedUser;
import com.phangwilly.portfolio.security.CurrentUserService;
import java.lang.reflect.Field;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

  private static final UUID USER_ID = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
  private static final Instant NOW = Instant.parse("2026-09-24T12:00:00Z");
  private static final Sort NEWEST_FIRST = Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));

  @Mock
  private NotificationRepository notificationRepository;
  @Mock
  private NotificationReadRepository readRepository;
  @Mock
  private CurrentUserService currentUserService;
  @Mock
  private ApplicationEventPublisher eventPublisher;

  private NotificationService service;

  @BeforeEach
  void setUp() {
    service = new NotificationService(
      notificationRepository,
      readRepository,
      currentUserService,
      eventPublisher,
      Clock.fixed(NOW, ZoneOffset.UTC)
    );
    when(currentUserService.requireAdmin()).thenReturn(
      new AuthenticatedUser(USER_ID, "admin@example.com", UserRole.ADMIN, "hash")
    );
  }

  @Test
  void listsEveryUnreadNotificationWithTheFirstTenRead() throws Exception {
    List<Notification> unread = List.of(
      notification("11111111-1111-1111-1111-111111111111", "Unread 1"),
      notification("22222222-2222-2222-2222-222222222222", "Unread 2"),
      notification("33333333-3333-3333-3333-333333333333", "Unread 3"),
      notification("44444444-4444-4444-4444-444444444444", "Unread 4"),
      notification("55555555-5555-5555-5555-555555555555", "Unread 5")
    );
    List<Notification> read = List.of(
      notification("66666666-6666-6666-6666-666666666661", "Read 1"),
      notification("66666666-6666-6666-6666-666666666662", "Read 2"),
      notification("66666666-6666-6666-6666-666666666663", "Read 3"),
      notification("66666666-6666-6666-6666-666666666664", "Read 4"),
      notification("66666666-6666-6666-6666-666666666665", "Read 5"),
      notification("66666666-6666-6666-6666-666666666666", "Read 6"),
      notification("66666666-6666-6666-6666-666666666667", "Read 7"),
      notification("66666666-6666-6666-6666-666666666668", "Read 8"),
      notification("66666666-6666-6666-6666-666666666669", "Read 9"),
      notification("66666666-6666-6666-6666-66666666666a", "Read 10")
    );
    when(notificationRepository.findUnread(USER_ID)).thenReturn(unread);
    when(notificationRepository.findRead(eq(USER_ID), any(Pageable.class))).thenReturn(
      new PageImpl<>(read, PageRequest.of(0, 10, NEWEST_FIRST), 22)
    );

    var response = service.list(null, null);

    ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
    verify(notificationRepository).findRead(eq(USER_ID), pageable.capture());
    assertThat(pageable.getValue().getPageNumber()).isZero();
    assertThat(pageable.getValue().getPageSize()).isEqualTo(10);
    assertThat(pageable.getValue().getSort()).isEqualTo(NEWEST_FIRST);
    assertThat(response.data()).hasSize(15);
    assertThat(response.data().stream().filter(item -> !item.read()).map(NotificationResponse::title))
      .containsExactly("Unread 1", "Unread 2", "Unread 3", "Unread 4", "Unread 5");
    assertThat(response.data().stream().filter(NotificationResponse::read).map(NotificationResponse::title))
      .containsExactly(
        "Read 1",
        "Read 2",
        "Read 3",
        "Read 4",
        "Read 5",
        "Read 6",
        "Read 7",
        "Read 8",
        "Read 9",
        "Read 10"
      );
    assertThat(response.pagination().page()).isZero();
    assertThat(response.pagination().size()).isEqualTo(10);
    assertThat(response.pagination().totalItems()).isEqualTo(22);
    assertThat(response.pagination().totalPages()).isEqualTo(3);
  }

  @Test
  void listsOnlyTheNextReadPage() throws Exception {
    List<Notification> read = List.of(
      notification("77777777-7777-7777-7777-777777777771", "Read 11"),
      notification("77777777-7777-7777-7777-777777777772", "Read 12")
    );
    when(notificationRepository.findRead(eq(USER_ID), any(Pageable.class))).thenReturn(
      new PageImpl<>(read, PageRequest.of(2, 10, NEWEST_FIRST), 22)
    );

    var response = service.list(2, null);

    ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
    verify(notificationRepository).findRead(eq(USER_ID), pageable.capture());
    verify(notificationRepository, never()).findUnread(any());
    assertThat(pageable.getValue().getPageNumber()).isEqualTo(2);
    assertThat(pageable.getValue().getPageSize()).isEqualTo(10);
    assertThat(response.data()).extracting(NotificationResponse::title).containsExactly("Read 11", "Read 12");
    assertThat(response.data()).allMatch(NotificationResponse::read);
    assertThat(response.pagination().page()).isEqualTo(2);
    assertThat(response.pagination().totalPages()).isEqualTo(3);
  }

  private static Notification notification(String id, String title) throws Exception {
    Notification notification = new Notification("front", title, title + " is down", NOW);
    Field field = UuidPrimaryKeyEntity.class.getDeclaredField("id");
    field.setAccessible(true);
    field.set(notification, UUID.fromString(id));
    return notification;
  }
}
