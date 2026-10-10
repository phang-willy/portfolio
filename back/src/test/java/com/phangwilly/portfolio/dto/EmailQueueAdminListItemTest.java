package com.phangwilly.portfolio.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.phangwilly.portfolio.model.EmailQueueErrorEntry;
import java.lang.reflect.RecordComponent;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;

class EmailQueueAdminListItemTest {

  @Test
  void doesNotExposeEmailBody() {
    assertThat(
        Arrays.stream(EmailQueueAdminListItem.class.getRecordComponents()).map(RecordComponent::getName)
      )
      .doesNotContain("body");
  }

  @Test
  void lastErrorIsAHistoryList() {
    RecordComponent lastError = Arrays.stream(EmailQueueAdminListItem.class.getRecordComponents())
      .filter(component -> component.getName().equals("lastError"))
      .findFirst()
      .orElseThrow();

    assertThat(lastError.getType()).isEqualTo(List.class);
    assertThat(lastError.getGenericType().getTypeName()).contains(EmailQueueErrorEntry.class.getName());
  }
}
