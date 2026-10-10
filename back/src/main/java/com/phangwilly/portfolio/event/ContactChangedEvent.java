package com.phangwilly.portfolio.event;

import com.phangwilly.portfolio.dto.ContactAdminListItem;

public record ContactChangedEvent(ContactAdminListItem contact) {}
