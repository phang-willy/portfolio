package com.phangwilly.portfolio.event;

import java.util.UUID;

public record EmailDeliveryRequestedEvent(UUID emailId) {}
