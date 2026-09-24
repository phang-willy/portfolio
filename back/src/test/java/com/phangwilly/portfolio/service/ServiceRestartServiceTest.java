package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.config.ServiceHealthProperties;
import com.phangwilly.portfolio.dto.ServiceHealthCheckResponse;
import com.phangwilly.portfolio.dto.ServiceRestartResponse;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.model.ServiceHealthKind;
import com.phangwilly.portfolio.model.ServiceHealthTarget;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ServiceRestartServiceTest {

  private static final ServiceHealthTarget FRONT = new ServiceHealthTarget(
    "front",
    "Front",
    "http://localhost:3000",
    ServiceHealthKind.HTTP,
    "http://front-dev:3000",
    null,
    0
  );

  @Mock private ServiceHealthProperties properties;
  @Mock private ComposeContainerControl containers;
  @Mock private ServiceHealthMonitor monitor;
  @Mock private ServiceHealthRealtimeService realtime;

  private final List<ServiceHealthCheckResponse> latest = new ArrayList<>();

  @BeforeEach
  void setUp() {
    when(properties.targets()).thenReturn(List.of(FRONT));
    when(properties.composeService("front")).thenReturn("front-dev");
    when(properties.composeProject()).thenReturn("portfolio");
    when(properties.restartProbeDelayMillis()).thenReturn(0L);
    when(realtime.current()).thenAnswer(invocation -> List.copyOf(latest));
  }

  @Test
  void restartsOnceAndStopsWhenTheServiceComesBack() throws Exception {
    AtomicInteger probes = new AtomicInteger();
    doAnswer(invocation -> {
      publish(probes.incrementAndGet() >= 2 ? "UP" : "DOWN");
      return null;
    }).when(monitor).check();

    ServiceRestartService service = service();
    assertThat(service.start("front").running()).isTrue();
    ServiceRestartResponse done = await(service);

    verify(containers, times(1)).restart("portfolio", "front-dev");
    assertThat(done.running()).isFalse();
    assertThat(done.status()).isEqualTo("UP");
    assertThat(done.attempt()).isEqualTo(2);
    assertThat(done.maxAttempts()).isEqualTo(5);
  }

  @Test
  void checksAtMostFiveTimesWhenTheServiceStaysDown() throws Exception {
    doAnswer(invocation -> {
      publish("DOWN");
      return null;
    }).when(monitor).check();

    ServiceRestartService service = service();
    service.start("front");
    ServiceRestartResponse done = await(service);

    verify(containers, times(1)).restart("portfolio", "front-dev");
    verify(monitor, times(5)).check();
    assertThat(done.attempt()).isEqualTo(5);
    assertThat(done.status()).isEqualTo("DOWN");
    assertThat(done.running()).isFalse();
  }

  @Test
  void ignoresASecondStartWhileTheRestartIsRunning() throws Exception {
    CountDownLatch insideRestart = new CountDownLatch(1);
    CountDownLatch release = new CountDownLatch(1);
    doAnswer(invocation -> {
      insideRestart.countDown();
      assertThat(release.await(5, TimeUnit.SECONDS)).isTrue();
      return null;
    }).when(containers).restart(anyString(), anyString());
    doAnswer(invocation -> {
      publish("UP");
      return null;
    }).when(monitor).check();

    ServiceRestartService service = service();
    service.start("front");
    assertThat(insideRestart.await(5, TimeUnit.SECONDS)).isTrue();
    service.start("front");
    release.countDown();
    await(service);

    verify(containers, times(1)).restart("portfolio", "front-dev");
  }

  @Test
  void rejectsAServiceThatCannotBeRestarted() {
    when(properties.composeService("front")).thenReturn(null);
    ServiceRestartService service = service();

    assertThatThrownBy(() -> service.start("front"))
      .isInstanceOf(ApiException.class)
      .hasMessage("This service cannot be restarted");
  }

  private ServiceRestartService service() {
    return new ServiceRestartService(properties, containers, monitor, realtime);
  }

  private void publish(String status) {
    latest.clear();
    latest.add(new ServiceHealthCheckResponse(
      "front",
      "Front",
      "http://localhost:3000",
      status,
      Instant.parse("2026-09-24T12:00:00Z"),
      true
    ));
  }

  private ServiceRestartResponse await(ServiceRestartService service) throws InterruptedException {
    long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(5);
    ServiceRestartResponse current = service.progress("front");
    while (current.running() && System.nanoTime() < deadline) {
      Thread.sleep(10);
      current = service.progress("front");
    }
    assertThat(current.running()).isFalse();
    return current;
  }
}
