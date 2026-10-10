package com.phangwilly.portfolio.dto;

import jakarta.validation.constraints.Size;

public record StackDeleteRequest(@Size(max = 500) String website) {}
