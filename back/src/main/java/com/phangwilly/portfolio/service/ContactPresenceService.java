package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.dto.ContactPresenceEvent;
import com.phangwilly.portfolio.dto.ContactPresenceState;
import com.phangwilly.portfolio.dto.ContactPresenceViewer;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.repository.ContactRepository;
import com.phangwilly.portfolio.repository.UserRepository;
import com.phangwilly.portfolio.security.AuthenticatedUser;
import com.phangwilly.portfolio.security.CurrentUserService;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class ContactPresenceService {

  static final Duration SESSION_TTL = Duration.ofSeconds(45);

  private final ContactRepository contactRepository;
  private final UserRepository userRepository;
  private final CurrentUserService currentUserService;
  private final ContactRealtimeService realtimeService;
  private final Clock clock;
  private final ConcurrentHashMap<UUID, ConcurrentHashMap<UUID, PresenceSession>> rooms =
    new ConcurrentHashMap<>();

  public ContactPresenceService(
    ContactRepository contactRepository,
    UserRepository userRepository,
    CurrentUserService currentUserService,
    ContactRealtimeService realtimeService,
    Clock clock
  ) {
    this.contactRepository = contactRepository;
    this.userRepository = userRepository;
    this.currentUserService = currentUserService;
    this.realtimeService = realtimeService;
    this.clock = clock;
  }

  public ContactPresenceState heartbeat(UUID contactId, UUID sessionId) {
    AuthenticatedUser actor = currentUserService.requireAdmin();
    requireContact(contactId);
    Instant now = clock.instant();
    String name = displayName(actor);
    AtomicBoolean membershipChanged = new AtomicBoolean(false);
    rooms.compute(contactId, (id, existing) -> {
      ConcurrentHashMap<UUID, PresenceSession> sessions =
        existing == null ? new ConcurrentHashMap<>() : existing;
      prune(sessions, now);
      PresenceSession current = sessions.get(sessionId);
      if (current == null || !current.userId().equals(actor.id())) {
        sessions.put(sessionId, new PresenceSession(sessionId, actor.id(), name, now, now));
        membershipChanged.set(true);
      } else {
        sessions.put(sessionId, current.touch(now));
      }
      return sessions.isEmpty() ? null : sessions;
    });
    ContactPresenceState state = snapshot(contactId, actor.id());
    if (membershipChanged.get()) {
      realtimeService.broadcastPresence(new ContactPresenceEvent(contactId, state.viewers()));
    }
    return state;
  }

  public ContactPresenceState leave(UUID contactId, UUID sessionId) {
    AuthenticatedUser actor = currentUserService.requireAdmin();
    requireContact(contactId);
    AtomicBoolean membershipChanged = new AtomicBoolean(false);
    rooms.computeIfPresent(contactId, (id, sessions) -> {
      prune(sessions, clock.instant());
      PresenceSession existing = sessions.get(sessionId);
      if (existing != null && existing.userId().equals(actor.id())) {
        sessions.remove(sessionId);
        membershipChanged.set(true);
      }
      return sessions.isEmpty() ? null : sessions;
    });
    ContactPresenceState state = snapshot(contactId, actor.id());
    if (membershipChanged.get()) {
      realtimeService.broadcastPresence(new ContactPresenceEvent(contactId, state.viewers()));
    }
    return state;
  }

  public boolean isReadOnly(UUID contactId, UUID userId) {
    pruneRoom(contactId, clock.instant());
    return snapshot(contactId, userId).readOnly();
  }

  @Scheduled(fixedDelayString = "15000")
  public void expireStaleSessions() {
    Instant now = clock.instant();
    for (UUID contactId : List.copyOf(rooms.keySet())) {
      AtomicBoolean membershipChanged = new AtomicBoolean(false);
      rooms.compute(contactId, (id, sessions) -> {
        if (sessions == null) {
          return null;
        }
        int before = sessions.size();
        prune(sessions, now);
        if (sessions.size() != before) {
          membershipChanged.set(true);
        }
        return sessions.isEmpty() ? null : sessions;
      });
      if (membershipChanged.get()) {
        ContactPresenceState state = snapshot(contactId, null);
        realtimeService.broadcastPresence(new ContactPresenceEvent(contactId, state.viewers()));
      }
    }
  }

  private void requireContact(UUID contactId) {
    contactRepository.findByIdAndDeletedAtIsNull(contactId).orElseThrow(ContactPresenceService::notFound);
  }

  private void pruneRoom(UUID contactId, Instant now) {
    rooms.computeIfPresent(contactId, (id, sessions) -> {
      prune(sessions, now);
      return sessions.isEmpty() ? null : sessions;
    });
  }

  private static void prune(ConcurrentHashMap<UUID, PresenceSession> sessions, Instant now) {
    Instant cutoff = now.minus(SESSION_TTL);
    sessions.entrySet().removeIf(entry -> entry.getValue().lastSeenAt().isBefore(cutoff));
  }

  private ContactPresenceState snapshot(UUID contactId, UUID viewerId) {
    ConcurrentHashMap<UUID, PresenceSession> sessions = rooms.get(contactId);
    List<ContactPresenceViewer> viewers = uniqueViewers(sessions);
    ContactPresenceViewer editor = viewers.isEmpty() ? null : viewers.getFirst();
    boolean readOnly = editor != null && viewerId != null && !editor.userId().equals(viewerId);
    ContactPresenceViewer occupant = viewers.stream()
      .filter(viewer -> viewerId == null || !viewer.userId().equals(viewerId))
      .findFirst()
      .orElse(null);
    return new ContactPresenceState(contactId, readOnly, occupant, viewers);
  }

  private static List<ContactPresenceViewer> uniqueViewers(
    ConcurrentHashMap<UUID, PresenceSession> sessions
  ) {
    if (sessions == null || sessions.isEmpty()) {
      return List.of();
    }
    LinkedHashMap<UUID, ContactPresenceViewer> unique = new LinkedHashMap<>();
    sessions.values().stream()
      .sorted(Comparator.comparing(PresenceSession::joinedAt).thenComparing(PresenceSession::sessionId))
      .forEach(session -> unique.putIfAbsent(
        session.userId(),
        new ContactPresenceViewer(session.userId(), session.name(), session.joinedAt())
      ));
    return List.copyOf(new ArrayList<>(unique.values()));
  }

  private String displayName(AuthenticatedUser actor) {
    return userRepository.findById(actor.id())
      .map(user -> (user.getFirstname() + " " + user.getLastname()).trim())
      .filter(name -> !name.isBlank())
      .orElse(actor.email());
  }

  private static ApiException notFound() {
    return new ApiException(HttpStatus.NOT_FOUND, "CONTACT_NOT_FOUND", "Contact not found");
  }

  private record PresenceSession(
    UUID sessionId, UUID userId, String name, Instant joinedAt, Instant lastSeenAt
  ) {
    private PresenceSession touch(Instant now) {
      return new PresenceSession(sessionId, userId, name, joinedAt, now);
    }
  }
}
