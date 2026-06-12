package com.phangwilly.portfolio.controller;

import com.phangwilly.portfolio.dto.ApiResponse;
import com.phangwilly.portfolio.dto.ApiResponses;
import com.phangwilly.portfolio.dto.PageResponse;
import com.phangwilly.portfolio.dto.StackDeleteRequest;
import com.phangwilly.portfolio.dto.StackRequest;
import com.phangwilly.portfolio.dto.StackResponse;
import com.phangwilly.portfolio.security.Honeypot;
import com.phangwilly.portfolio.service.StackService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/stacks")
public class StackAdminController {

  private static final String STACK_DELETED_MESSAGE = "Stack deleted";

  private final StackService stackService;

  public StackAdminController(StackService stackService) {
    this.stackService = stackService;
  }

  @GetMapping
  public ResponseEntity<ApiResponse<PageResponse<StackResponse>>> getStacks(
    @RequestParam(required = false) Integer page,
    @RequestParam(required = false) Integer size
  ) {
    return ApiResponses.ok(stackService.getStacks(page, size));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ApiResponse<StackResponse>> getStack(@PathVariable UUID id) {
    return ApiResponses.ok(stackService.getStack(id));
  }

  @PostMapping
  public ResponseEntity<ApiResponse<StackResponse>> createStack(
    @Valid @RequestBody StackRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok(null);
    }

    return ApiResponses.ok(stackService.createStack(request));
  }

  @PutMapping("/{id}")
  public ResponseEntity<ApiResponse<StackResponse>> updateStack(
    @PathVariable UUID id,
    @Valid @RequestBody StackRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok(null);
    }

    return ApiResponses.ok(stackService.updateStack(id, request));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<ApiResponse<Void>> deleteStack(
    @PathVariable UUID id,
    @Valid @RequestBody StackDeleteRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.okMessage(STACK_DELETED_MESSAGE);
    }

    stackService.deleteStack(id);
    return ApiResponses.okMessage(STACK_DELETED_MESSAGE);
  }
}
