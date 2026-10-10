package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.dto.ContactAdminDetail;
import com.phangwilly.portfolio.dto.ContactAdminListItem;
import com.phangwilly.portfolio.dto.ContactHistoryItem;
import com.phangwilly.portfolio.dto.ContactReplyRequest;
import com.phangwilly.portfolio.dto.ContactUnreadCountResponse;
import com.phangwilly.portfolio.dto.PageResponse;
import com.phangwilly.portfolio.dto.PaginationRequest;
import com.phangwilly.portfolio.enums.ContactStatus;
import com.phangwilly.portfolio.event.ContactChangedEvent;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.model.Contact;
import com.phangwilly.portfolio.model.ContactHistory;
import com.phangwilly.portfolio.model.EmailQueue;
import com.phangwilly.portfolio.repository.ContactHistoryRepository;
import com.phangwilly.portfolio.repository.ContactRepository;
import com.phangwilly.portfolio.repository.UserRepository;
import com.phangwilly.portfolio.security.AuthenticatedUser;
import com.phangwilly.portfolio.security.CurrentUserService;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Locale;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContactAdminService {

  private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.DESC, "createdAt", "id");
  private final ContactRepository contactRepository;
  private final ContactHistoryRepository historyRepository;
  private final UserRepository userRepository;
  private final CurrentUserService currentUserService;
  private final ContactReplyEmailFactory emailFactory;
  private final EmailQueueService emailQueueService;
  private final ContactPresenceService presenceService;
  private final ApplicationEventPublisher eventPublisher;
  private final Clock clock;

  public ContactAdminService(
    ContactRepository contactRepository, ContactHistoryRepository historyRepository,
    UserRepository userRepository, CurrentUserService currentUserService,
    ContactReplyEmailFactory emailFactory, EmailQueueService emailQueueService,
    ContactPresenceService presenceService, ApplicationEventPublisher eventPublisher, Clock clock
  ) {
    this.contactRepository = contactRepository;
    this.historyRepository = historyRepository;
    this.userRepository = userRepository;
    this.currentUserService = currentUserService;
    this.emailFactory = emailFactory;
    this.emailQueueService = emailQueueService;
    this.presenceService = presenceService;
    this.eventPublisher = eventPublisher;
    this.clock = clock;
  }

  @Transactional(readOnly = true)
  public PageResponse<ContactAdminListItem> getContacts(
    Integer page, Integer size, String search, ContactStatus status
  ) {
    currentUserService.requireAdmin();
    String term = search == null ? "" : search.trim();
    if (term.length() > 200) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "CONTACT_INVALID_SEARCH", "Search is too long");
    }
    Specification<Contact> filters = (root, query, builder) -> builder.isNull(root.get("deletedAt"));
    if (status != null) {
      filters = filters.and((root, query, builder) -> builder.equal(root.get("status"), status));
    }
    if (!term.isEmpty()) {
      String pattern = "%" + escapeLike(term.toLowerCase(Locale.ROOT)) + "%";
      filters = filters.and((root, query, builder) -> builder.or(
        builder.like(builder.lower(root.get("firstname")), pattern, '!'),
        builder.like(builder.lower(root.get("lastname")), pattern, '!'),
        builder.like(builder.lower(root.get("email")), pattern, '!'),
        builder.like(builder.lower(root.get("subject")), pattern, '!'),
        builder.like(builder.lower(builder.concat(
          builder.concat(root.get("firstname"), " "), root.get("lastname")
        )), pattern, '!')
      ));
    }
    return PageResponse.from(contactRepository.findAll(
      filters, PaginationRequest.of(page, size).toPageable(DEFAULT_SORT)
    ).map(ContactAdminListItem::from));
  }

  @Transactional(readOnly = true)
  public ContactAdminDetail getContact(UUID id) {
    currentUserService.requireAdmin();
    return toDetail(contactRepository.findByIdAndDeletedAtIsNull(id).orElseThrow(ContactAdminService::notFound));
  }

  @Transactional(readOnly = true)
  public ContactUnreadCountResponse getUnreadCount() {
    currentUserService.requireAdmin();
    return new ContactUnreadCountResponse(contactRepository.countByStatusAndDeletedAtIsNull(ContactStatus.RECEIVED));
  }

  @Transactional
  public ContactAdminDetail markRead(UUID id) {
    AuthenticatedUser actor = currentUserService.requireAdmin();
    Contact contact = getForUpdate(id);
    contact.markRead(Instant.now(clock));
    historyRepository.saveAndFlush(ContactHistory.read(contact, actor.id(), actorName(actor)));
    contactRepository.saveAndFlush(contact);
    publishChange(contact);
    return toDetail(contact);
  }

  @Transactional
  public ContactAdminDetail reply(UUID id, String message) {
    AuthenticatedUser actor = currentUserService.requireAdmin();
    if (message == null || message.isBlank() || message.length() > ContactReplyRequest.MESSAGE_MAX_LENGTH) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        "CONTACT_INVALID_REPLY",
        "Reply must contain 1 to " + ContactReplyRequest.MESSAGE_MAX_LENGTH + " characters"
      );
    }
    if (presenceService.isReadOnly(id, actor.id())) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        "CONTACT_PAGE_OCCUPIED",
        "Another administrator is already working on this enquiry."
      );
    }
    Contact contact = getForUpdate(id);
    String reply = message.trim();
    String actorName = actorName(actor);
    EmailQueue email = emailQueueService.enqueue(emailFactory.create(contact, reply));
    if (contact.getFirstReadAt() == null) {
      historyRepository.save(ContactHistory.read(contact, actor.id(), actorName));
    }
    contact.markReplied(Instant.now(clock));
    historyRepository.saveAndFlush(ContactHistory.replied(contact, actor.id(), actorName, reply, email));
    contactRepository.saveAndFlush(contact);
    publishChange(contact);
    emailQueueService.requestDelivery(email.getId());
    return toDetail(contact);
  }

  private Contact getForUpdate(UUID id) {
    return contactRepository.findActiveForUpdate(id).orElseThrow(ContactAdminService::notFound);
  }

  private ContactAdminDetail toDetail(Contact contact) {
    var history = new ArrayList<ContactHistoryItem>();
    // Receipt is immutable and derived from the original row, including imported contacts.
    history.add(ContactHistoryItem.received(contact));
    historyRepository.findByContactIdAndDeletedAtIsNullOrderByCreatedAtAscIdAsc(contact.getId())
      .stream().map(ContactHistoryItem::from).forEach(history::add);
    return ContactAdminDetail.from(contact, history);
  }

  private String actorName(AuthenticatedUser actor) {
    return userRepository.findById(actor.id())
      .map(user -> (user.getFirstname() + " " + user.getLastname()).trim())
      .filter(name -> !name.isBlank())
      .orElse(actor.email());
  }

  private void publishChange(Contact contact) {
    eventPublisher.publishEvent(new ContactChangedEvent(ContactAdminListItem.from(contact)));
  }

  private static String escapeLike(String value) {
    return value.replace("!", "!!").replace("%", "!%").replace("_", "!_");
  }

  private static ApiException notFound() {
    return new ApiException(HttpStatus.NOT_FOUND, "CONTACT_NOT_FOUND", "Contact not found");
  }
}
