package com.phangwilly.portfolio.dto;

public record EmailQueueRealtimeEvent(EmailQueueAdminListItem email, long failedCount) {}
