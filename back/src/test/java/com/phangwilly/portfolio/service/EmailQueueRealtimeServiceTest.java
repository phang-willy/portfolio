package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.dto.EmailQueueAdminListItem;
import com.phangwilly.portfolio.enums.EmailQueueStatus;
import com.phangwilly.portfolio.event.EmailQueueChangedEvent;
import com.phangwilly.portfolio.model.EmailQueueErrorEntry;
import com.phangwilly.portfolio.repository.EmailQueueRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@ExtendWith(MockitoExtension.class)
class EmailQueueRealtimeServiceTest {

  @Mock
  private EmailQueueRepository emailQueueRepository;

  private EmailQueueRealtimeService service;

  @BeforeEach
  void setUp() {
    service = new EmailQueueRealtimeService(emailQueueRepository);
  }

  @Test
  void subscribeReturnsOpenEmitter() {
    SseEmitter emitter = service.subscribe();

    assertThat(emitter).isNotNull();
    assertThat(emitter.getTimeout()).isEqualTo(java.util.concurrent.TimeUnit.HOURS.toMillis(6));
  }

  @Test
  void onEmailQueueChangedReadsFailedCount() {
    EmailQueueAdminListItem item = new EmailQueueAdminListItem(
      UUID.fromString("11111111-1111-1111-1111-111111111111"),
      "user@example.com",
      "Verify your email",
      EmailQueueStatus.FAILED,
      3,
      3,
      List.of(new EmailQueueErrorEntry("2026-01-01T10:00:00Z", "smtp down")),
      Instant.parse("2026-01-01T10:00:00Z"),
      null,
      Instant.parse("2026-01-01T10:00:00Z")
    );
    when(emailQueueRepository.countByStatus(EmailQueueStatus.FAILED)).thenReturn(2L);

    service.subscribe();
    service.onEmailQueueChanged(new EmailQueueChangedEvent(item));

    verify(emailQueueRepository).countByStatus(EmailQueueStatus.FAILED);
  }
}
