package com.phangwilly.portfolio.controller;

import com.phangwilly.portfolio.dto.ApiResponse;
import com.phangwilly.portfolio.dto.ApiResponses;
import com.phangwilly.portfolio.dto.ContactRequest;
import com.phangwilly.portfolio.security.Honeypot;
import com.phangwilly.portfolio.service.ContactService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

  private final ContactService contactService;

  public ContactController(ContactService contactService) {
    this.contactService = contactService;
  }

  @PostMapping
  public ResponseEntity<ApiResponse<Void>> create(@Valid @RequestBody ContactRequest request) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok();
    }
    contactService.submit(request);
    return ApiResponses.ok();
  }
}
