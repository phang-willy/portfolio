package com.phangwilly.portfolio.dto;

import jakarta.validation.constraints.Size;

public record ExperienceContractTypeDeleteRequest(@Size(max = 500) String website) {}
