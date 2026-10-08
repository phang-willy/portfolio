package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.dto.StackRequest;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.model.Stack;
import com.phangwilly.portfolio.repository.StackRepository;
import com.phangwilly.portfolio.security.AuthenticatedUser;
import com.phangwilly.portfolio.security.CurrentUserService;
import com.phangwilly.portfolio.enums.UserRole;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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

  @Test
  void createStackStoresAStaticInlineSvg() {
    when(currentUserService.requireAdmin())
      .thenReturn(new AuthenticatedUser(UUID.randomUUID(), "admin@example.com", UserRole.ADMIN, "hash"));
    when(stackRepository.saveAndFlush(any(Stack.class))).thenAnswer(invocation -> invocation.getArgument(0));
    String logo = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 8 8\"><path d=\"M0 0h8v8z\"/></svg>";

    stackService.createStack(new StackRequest("Angular", "  " + logo + "  ", null));

    ArgumentCaptor<Stack> saved = ArgumentCaptor.forClass(Stack.class);
    verify(stackRepository).saveAndFlush(saved.capture());
    assertThat(saved.getValue().getImage()).isEqualTo(logo);
  }

  @Test
  void createStackRejectsSvgWithScriptOrExternalContent() {
    when(currentUserService.requireAdmin())
      .thenReturn(new AuthenticatedUser(UUID.randomUUID(), "admin@example.com", UserRole.ADMIN, "hash"));

    assertRejectedLogo("<svg><script>alert(1)</script></svg>");
    assertRejectedLogo("<svg onload=\"alert(1)\"></svg>");
    assertRejectedLogo("<svg><image href=\"https://evil.example/x.png\"/></svg>");
    assertRejectedLogo("<svg><use href=\"https://evil.example/x.svg#a\"/></svg>");
    assertRejectedLogo("not-an-svg");
    verifyNoInteractions(stackRepository);
  }

  private void assertRejectedLogo(String image) {
    assertThatThrownBy(() -> stackService.createStack(new StackRequest("Angular", image, null)))
      .isInstanceOf(ApiException.class)
      .satisfies(error -> {
        ApiException apiException = (ApiException) error;
        assertThat(apiException.status()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(apiException.code()).isEqualTo("INVALID_SVG");
      });
  }
}
