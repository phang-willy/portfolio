package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.EmailQueueProperties;
import com.phangwilly.portfolio.dto.EmailQueueAdminListItem;
import com.phangwilly.portfolio.dto.EmailQueueFailedCountResponse;
import com.phangwilly.portfolio.dto.PageResponse;
import com.phangwilly.portfolio.dto.PaginationRequest;
import com.phangwilly.portfolio.enums.EmailQueueStatus;
import com.phangwilly.portfolio.repository.EmailQueueRepository;
import com.phangwilly.portfolio.security.CurrentUserService;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmailQueueAdminService {

  private static final Sort DEFAULT_SORT = Sort
    .by(Sort.Direction.DESC, "createdAt")
    .and(Sort.by(Sort.Direction.DESC, "id"));

  private final EmailQueueRepository emailQueueRepository;
  private final EmailQueueProperties properties;
  private final EmailQueueService emailQueueService;
  private final CurrentUserService currentUserService;

  public EmailQueueAdminService(
    EmailQueueRepository emailQueueRepository,
    EmailQueueProperties properties,
    EmailQueueService emailQueueService,
    CurrentUserService currentUserService
  ) {
    this.emailQueueRepository = emailQueueRepository;
    this.properties = properties;
    this.emailQueueService = emailQueueService;
    this.currentUserService = currentUserService;
  }

  @Transactional(readOnly = true)
  public PageResponse<EmailQueueAdminListItem> getEmails(Integer page, Integer size) {
    PaginationRequest paginationRequest = PaginationRequest.of(page, size);

    return PageResponse.from(
      emailQueueRepository
        .findAll(paginationRequest.toPageable(DEFAULT_SORT))
        .map(email -> EmailQueueAdminListItem.from(email, properties.getMaxAttempts()))
    );
  }

  @Transactional(readOnly = true)
  public EmailQueueFailedCountResponse getFailedCount() {
    return new EmailQueueFailedCountResponse(emailQueueRepository.countByStatus(EmailQueueStatus.FAILED));
  }

  @Transactional
  public EmailQueueAdminListItem resend(UUID id) {
    currentUserService.requireAdmin();
    return emailQueueService.resend(id);
  }
}
