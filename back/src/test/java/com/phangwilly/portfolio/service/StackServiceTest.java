package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.dto.StackRequest;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.repository.StackRepository;
import com.phangwilly.portfolio.security.AuthenticatedUser;
import com.phangwilly.portfolio.security.CurrentUserService;
import com.phangwilly.portfolio.enums.UserRole;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class StackServiceTest {

  @Mock
  private StackRepository stackRepository;

  @Mock
  private CurrentUserService currentUserService;

  private StackService stackService;

  @BeforeEach
  void setUp() {
    stackService = new StackService(stackRepository, currentUserService);
  }

  @Test
  void createStackRequiresAdminRole() {
    when(currentUserService.requireAdmin())
      .thenThrow(new ApiException(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Access denied"));

    assertThatThrownBy(() -> stackService.createStack(new StackRequest("Angular", null, null)))
      .isInstanceOf(ApiException.class)
      .extracting(error -> ((ApiException) error).status())
      .isEqualTo(HttpStatus.FORBIDDEN);

    verifyNoInteractions(stackRepository);
  }

  @Test
  void deleteStackRequiresAdminRole() {
    UUID stackId = UUID.randomUUID();
    when(currentUserService.requireAdmin())
      .thenThrow(new ApiException(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Access denied"));

    assertThatThrownBy(() -> stackService.deleteStack(stackId))
      .isInstanceOf(ApiException.class)
      .extracting(error -> ((ApiException) error).status())
      .isEqualTo(HttpStatus.FORBIDDEN);

    verifyNoInteractions(stackRepository);
  }

  @Test
  void deleteStackDelegatesWhenAdmin() {
    UUID stackId = UUID.randomUUID();
    when(currentUserService.requireAdmin())
      .thenReturn(new AuthenticatedUser(UUID.randomUUID(), "admin@example.com", UserRole.ADMIN, "hash"));

    assertThatThrownBy(() -> stackService.deleteStack(stackId))
      .isInstanceOf(ApiException.class)
      .extracting(error -> ((ApiException) error).status())
      .isEqualTo(HttpStatus.NOT_FOUND);

    verify(currentUserService).requireAdmin();
  }
}
