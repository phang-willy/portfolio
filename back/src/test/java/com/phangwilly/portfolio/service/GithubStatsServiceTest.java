package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.dto.GithubStatsResponse;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GithubStatsServiceTest {

  @Mock
  private GithubStatsClient client;

  @Test
  void refreshStoresStatsAndKeepsThemWhenTheNextFetchFails() {
    GithubStatsResponse stats = new GithubStatsResponse(10, 4, 2, 6);
    when(client.fetch()).thenReturn(Optional.of(stats), Optional.empty());
    GithubStatsService service = new GithubStatsService(client);

    service.refresh();
    service.refresh();

    assertThat(service.current()).isEqualTo(stats);
  }

  @Test
  void refreshKeepsThePreviousSnapshotWhenGithubFails() {
    GithubStatsResponse stats = new GithubStatsResponse(10, 4, 2, 6);
    when(client.fetch()).thenReturn(Optional.of(stats)).thenThrow(new IllegalStateException("down"));
    GithubStatsService service = new GithubStatsService(client);

    service.refresh();
    service.refresh();

    assertThat(service.current()).isEqualTo(stats);
  }
}
