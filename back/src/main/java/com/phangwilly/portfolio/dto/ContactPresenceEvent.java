package com.phangwilly.portfolio.dto;

import java.util.List;
import java.util.UUID;

public record ContactPresenceEvent(UUID contactId, List<ContactPresenceViewer> viewers) {}
