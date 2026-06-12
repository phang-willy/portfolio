package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.dto.PageResponse;
import com.phangwilly.portfolio.dto.PaginationRequest;
import com.phangwilly.portfolio.dto.StackRequest;
import com.phangwilly.portfolio.dto.StackResponse;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.model.Stack;
import com.phangwilly.portfolio.repository.StackRepository;
import com.phangwilly.portfolio.security.CurrentUserService;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StackService {

  private static final String STACK_NOT_FOUND_CODE = "STACK_NOT_FOUND";
  private static final String STACK_NOT_FOUND_MESSAGE = "Stack not found";

  private static final Sort DEFAULT_SORT = Sort
    .by(Sort.Direction.ASC, "name")
    .and(Sort.by(Sort.Direction.ASC, "id"));

  private final StackRepository stackRepository;
  private final CurrentUserService currentUserService;

  public StackService(StackRepository stackRepository, CurrentUserService currentUserService) {
    this.stackRepository = stackRepository;
    this.currentUserService = currentUserService;
  }

  @Transactional(readOnly = true)
  public PageResponse<StackResponse> getStacks(Integer page, Integer size) {
    PaginationRequest paginationRequest = PaginationRequest.of(page, size);

    return PageResponse.from(
      stackRepository
        .findByDeletedAtIsNull(paginationRequest.toPageable(DEFAULT_SORT))
        .map(StackResponse::from)
    );
  }

  @Transactional(readOnly = true)
  public StackResponse getStack(UUID id) {
    return StackResponse.from(getActiveStack(id));
  }

  @Transactional
  public StackResponse createStack(StackRequest request) {
    currentUserService.requireAdmin();
    Stack stack = new Stack(request.name().trim(), normalizeImage(request.image()));
    return StackResponse.from(stackRepository.saveAndFlush(stack));
  }

  @Transactional
  public StackResponse updateStack(UUID id, StackRequest request) {
    Stack stack = getActiveStack(id);
    stack.updateDetails(request.name().trim(), normalizeImage(request.image()));
    return StackResponse.from(stackRepository.saveAndFlush(stack));
  }

  @Transactional
  public void deleteStack(UUID id) {
    currentUserService.requireAdmin();
    Stack stack = getActiveStack(id);
    stack.markDeleted();
    stackRepository.saveAndFlush(stack);
  }

  private Stack getActiveStack(UUID id) {
    return stackRepository
      .findByIdAndDeletedAtIsNull(id)
      .orElseThrow(() -> new ApiException(
        HttpStatus.NOT_FOUND,
        STACK_NOT_FOUND_CODE,
        STACK_NOT_FOUND_MESSAGE
      ));
  }

  private static String normalizeImage(String image) {
    if (image == null) {
      return null;
    }

    String trimmed = image.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }
}
