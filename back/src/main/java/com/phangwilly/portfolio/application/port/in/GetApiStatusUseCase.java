package com.phangwilly.portfolio.application.port.in;

import com.phangwilly.portfolio.domain.model.ApiStatus;

public interface GetApiStatusUseCase {

  ApiStatus getStatus();
}
