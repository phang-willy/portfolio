package com.phangwilly.portfolio.dto;

import java.util.List;
import java.util.UUID;

public record ContactPresenceState(
  UUID contactId,
  boolean readOnly,
  ContactPresenceViewer occupant,
  List<ContactPresenceViewer> viewers
) {}
