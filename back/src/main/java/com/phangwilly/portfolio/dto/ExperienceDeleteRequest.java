package com.phangwilly.portfolio.dto;

import jakarta.validation.constraints.Size;

public record ExperienceDeleteRequest(@Size(max = 500) String website) {}
