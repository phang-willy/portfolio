package com.phangwilly.portfolio.dto;

import jakarta.validation.constraints.Size;

public record ProjectDeleteRequest(@Size(max = 500) String website) {}
