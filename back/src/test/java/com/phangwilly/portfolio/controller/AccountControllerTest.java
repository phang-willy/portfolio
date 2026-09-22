package com.phangwilly.portfolio.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.dto.AuthMessageResponse;
import com.phangwilly.portfolio.dto.ChangePasswordRequest;
import com.phangwilly.portfolio.dto.ProfileUpdateRequest;
import com.phangwilly.portfolio.dto.ProfileUpdateResponse;
import com.phangwilly.portfolio.dto.UserResponse;
import com.phangwilly.portfolio.enums.UserRole;
import com.phangwilly.portfolio.security.AuthCookieService;
import com.phangwilly.portfolio.service.AccountService;
import jakarta.servlet.http.HttpServletResponse;
import java.util.UUID;
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

  @Mock
  private AuthCookieService authCookieService;

  @Mock
  private HttpServletResponse httpServletResponse;

  private AccountController controller;

  @BeforeEach
  void setUp() {
    controller = new AccountController(accountService, authCookieService);
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
    verifyNoInteractions(authCookieService);
  }

  @Test
  void updateProfileSkipsServiceWhenHoneypotIsFilled() {
    var request = new ProfileUpdateRequest("DOE", "Ada", "ada@example.com", true, "spam");

    var response = controller.updateProfile(request, httpServletResponse);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).isNull();
    verifyNoInteractions(accountService, authCookieService);
  }

  @Test
  void updateProfileClearsSessionCookieWhenEmailChanges() {
    var request = new ProfileUpdateRequest("DOE", "Ada", "ada.new@example.com", true, "");
    var updated = new ProfileUpdateResponse(
      new UserResponse(
        UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2"),
        "Ada",
        "DOE",
        "ada.new@example.com",
        UserRole.ADMIN
      ),
      true
    );
    when(accountService.updateProfile(request)).thenReturn(updated);

    var response = controller.updateProfile(request, httpServletResponse);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).isEqualTo(updated);
    verify(authCookieService).clearSessionCookie(httpServletResponse);
  }
}
