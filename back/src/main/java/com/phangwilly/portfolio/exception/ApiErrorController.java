package com.phangwilly.portfolio.exception;

import com.phangwilly.portfolio.dto.ApiResponse;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.webmvc.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ApiErrorController implements ErrorController {

  @RequestMapping("${server.error.path:${error.path:/error}}")
  public ResponseEntity<ApiResponse<Void>> handleError(HttpServletRequest request) {
    HttpStatus status = resolveStatus(request);
    return ResponseEntity.status(status).body(ApiResponse.error(status, null));
  }

  private HttpStatus resolveStatus(HttpServletRequest request) {
    Object statusCode = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
    if (statusCode instanceof Integer code) {
      HttpStatus resolved = HttpStatus.resolve(code);
      if (resolved != null) {
        return resolved;
      }
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
