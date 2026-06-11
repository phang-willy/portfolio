package com.phangwilly.portfolio.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.dto.AuthMessageResponse;
import com.phangwilly.portfolio.dto.ChangePasswordRequest;
import com.phangwilly.portfolio.service.AccountService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class AccountControllerTest {

  @Mock
  private AccountService accountService;

  private AccountController controller;

  @BeforeEach
  void setUp() {
    controller = new AccountController(accountService);
  }

  @Test
  void changePasswordSkipsServiceWhenHoneypotIsFilled() {
    var request = new ChangePasswordRequest("old-password", "new-password", "new-password", "spam");

    var response = controller.changePassword(request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().message()).isEqualTo("Password changed");
    verifyNoInteractions(accountService);
  }

  @Test
  void changePasswordDelegatesToServiceWhenHoneypotIsEmpty() {
    var request = new ChangePasswordRequest("old-password", "new-password", "new-password", null);
    when(accountService.changePassword(request))
      .thenReturn(new AuthMessageResponse("Password changed"));

    var response = controller.changePassword(request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    verify(accountService).changePassword(request);
  }
}
