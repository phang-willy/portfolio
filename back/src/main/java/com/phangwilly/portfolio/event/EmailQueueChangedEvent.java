package com.phangwilly.portfolio.event;

import com.phangwilly.portfolio.dto.EmailQueueAdminListItem;

public record EmailQueueChangedEvent(EmailQueueAdminListItem email) {}
