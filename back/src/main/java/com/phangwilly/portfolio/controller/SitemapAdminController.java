package com.phangwilly.portfolio.controller;

import com.phangwilly.portfolio.dto.ApiResponse;
import com.phangwilly.portfolio.dto.ApiResponses;
import com.phangwilly.portfolio.dto.SitemapGenerationResponse;
import com.phangwilly.portfolio.security.CurrentUserService;
import com.phangwilly.portfolio.service.SitemapAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/sitemap")
public class SitemapAdminController {

  private final CurrentUserService currentUserService;
  private final SitemapAdminService sitemapAdminService;

  public SitemapAdminController(
    CurrentUserService currentUserService,
    SitemapAdminService sitemapAdminService
  ) {
    this.currentUserService = currentUserService;
    this.sitemapAdminService = sitemapAdminService;
  }

  @PostMapping
  public ResponseEntity<ApiResponse<SitemapGenerationResponse>> generate() {
    currentUserService.requireAdmin();
    return ApiResponses.ok(sitemapAdminService.generate());
  }
}
