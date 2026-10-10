package com.phangwilly.portfolio.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.dto.StackDeleteRequest;
import com.phangwilly.portfolio.dto.StackRequest;
import com.phangwilly.portfolio.dto.StackResponse;
import com.phangwilly.portfolio.service.StackService;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class StackAdminControllerTest {

  private static final UUID STACK_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
  private static final StackResponse STACK_RESPONSE = new StackResponse(
    STACK_ID,
    "Angular",
    "<svg></svg>",
    Instant.parse("2026-01-01T00:00:00Z"),
    Instant.parse("2026-01-01T00:00:00Z")
  );

  @Mock
  private StackService stackService;

  private StackAdminController controller;

  @BeforeEach
  void setUp() {
    controller = new StackAdminController(stackService);
  }

  @Test
  void createStackSkipsServiceWhenHoneypotIsFilled() {
    var request = new StackRequest("Angular", "<svg></svg>", "https://spam.example");

    var response = controller.createStack(request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).isNull();
    verifyNoInteractions(stackService);
  }

  @Test
  void createStackDelegatesToServiceWhenHoneypotIsEmpty() {
    var request = new StackRequest("Angular", "<svg></svg>", null);
    when(stackService.createStack(request)).thenReturn(STACK_RESPONSE);

    var response = controller.createStack(request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).isEqualTo(STACK_RESPONSE);
    verify(stackService).createStack(request);
  }

  @Test
  void updateStackSkipsServiceWhenHoneypotIsFilled() {
    var request = new StackRequest("Angular", "<svg></svg>", "bot");

    var response = controller.updateStack(STACK_ID, request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).isNull();
    verifyNoInteractions(stackService);
  }

  @Test
  void updateStackDelegatesToServiceWhenHoneypotIsEmpty() {
    var request = new StackRequest("Angular", "<svg></svg>", null);
    when(stackService.updateStack(STACK_ID, request)).thenReturn(STACK_RESPONSE);

    var response = controller.updateStack(STACK_ID, request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).isEqualTo(STACK_RESPONSE);
    verify(stackService).updateStack(STACK_ID, request);
  }

  @Test
  void deleteStackSkipsServiceWhenHoneypotIsFilled() {
    var request = new StackDeleteRequest("spam");

    var response = controller.deleteStack(STACK_ID, request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().message()).isEqualTo("Stack deleted");
    verifyNoInteractions(stackService);
  }

  @Test
  void deleteStackDelegatesToServiceWhenHoneypotIsEmpty() {
    var request = new StackDeleteRequest(null);

    var response = controller.deleteStack(STACK_ID, request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().message()).isEqualTo("Stack deleted");
    verify(stackService).deleteStack(STACK_ID);
  }
}
