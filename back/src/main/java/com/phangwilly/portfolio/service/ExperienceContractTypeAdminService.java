package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.dto.ExperienceContractTypeAdminDetail;
import com.phangwilly.portfolio.dto.ExperienceContractTypeAdminListItem;
import com.phangwilly.portfolio.dto.ExperienceContractTypeAdminRequest;
import com.phangwilly.portfolio.dto.ExperienceContractTypeLocaleRequest;
import com.phangwilly.portfolio.dto.PageResponse;
import com.phangwilly.portfolio.dto.PaginationRequest;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.model.ExperienceContractType;
import com.phangwilly.portfolio.repository.ExperienceContractTypeRepository;
import com.phangwilly.portfolio.repository.ExperienceRepository;
import com.phangwilly.portfolio.security.CurrentUserService;
import com.phangwilly.portfolio.util.SlugUtils;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExperienceContractTypeAdminService {

  private static final String NOT_FOUND_CODE = "EXPERIENCE_CONTRACT_TYPE_NOT_FOUND";
  private static final String NOT_FOUND_MESSAGE = "Experience contract type not found";
  private static final String SLUG_EXISTS_CODE = "EXPERIENCE_CONTRACT_TYPE_SLUG_EXISTS";
  private static final String SLUG_EXISTS_MESSAGE =
    "An experience contract type with this slug already exists";
  private static final String CODE_EXISTS_CODE = "EXPERIENCE_CONTRACT_TYPE_CODE_EXISTS";
  private static final String CODE_EXISTS_MESSAGE =
    "An experience contract type with this code already exists";
  private static final String NOT_DEACTIVATED_CODE = "EXPERIENCE_CONTRACT_TYPE_NOT_DEACTIVATED";
  private static final String NOT_DEACTIVATED_MESSAGE =
    "Experience contract type must be deactivated before it can be permanently deleted";
  private static final String IN_USE_CODE = "EXPERIENCE_CONTRACT_TYPE_IN_USE";
  private static final String IN_USE_MESSAGE =
    "Experience contract type is still used by one or more experiences";
  private static final String LANG_FR = "fr";
  private static final String LANG_EN = "en";
  private static final Sort SLUG_SORT = Sort.by(Sort.Direction.ASC, "slug");

  private final ExperienceContractTypeRepository repository;
  private final ExperienceRepository experienceRepository;
  private final CurrentUserService currentUserService;

  public ExperienceContractTypeAdminService(
    ExperienceContractTypeRepository repository,
    ExperienceRepository experienceRepository,
    CurrentUserService currentUserService
  ) {
    this.repository = repository;
    this.experienceRepository = experienceRepository;
    this.currentUserService = currentUserService;
  }

  @Transactional(readOnly = true)
  public PageResponse<ExperienceContractTypeAdminListItem> getContractTypes(
    Integer page,
    Integer size
  ) {
    PaginationRequest paginationRequest = PaginationRequest.of(page, size);
    Page<String> slugPage = repository.findDistinctActiveSlugs(
      paginationRequest.toPageable(SLUG_SORT)
    );

    List<ExperienceContractTypeAdminListItem> items = slugPage
      .getContent()
      .stream()
      .map(this::toListItem)
      .toList();

    return new PageResponse<>(
      items,
      new PageResponse.Pagination(
        slugPage.getNumber(),
        slugPage.getSize(),
        slugPage.getTotalElements(),
        slugPage.getTotalPages()
      )
    );
  }

  @Transactional(readOnly = true)
  public ExperienceContractTypeAdminDetail getContractType(UUID id) {
    return toDetail(getGroup(id));
  }

  @Transactional
  public ExperienceContractTypeAdminDetail createContractType(
    ExperienceContractTypeAdminRequest request
  ) {
    currentUserService.requireAdmin();
    String slug = SlugUtils.slugify(request.fr().title());
    String codeFr = SlugUtils.slugify(request.fr().title(), LANG_FR);
    String codeEn = SlugUtils.slugify(request.en().title(), LANG_EN);

    assertSlugAvailable(slug);
    assertCodeAvailable(codeFr);
    assertCodeAvailable(codeEn);

    ExperienceContractType fr = createLocale(slug, codeFr, LANG_FR, request.fr());
    ExperienceContractType en = createLocale(slug, codeEn, LANG_EN, request.en());

    return toDetail(List.of(fr, en));
  }

  @Transactional
  public ExperienceContractTypeAdminDetail updateContractType(
    UUID id,
    ExperienceContractTypeAdminRequest request
  ) {
    List<ExperienceContractType> existing = getGroup(id);
    ExperienceContractType fr = findByLang(existing, LANG_FR);
    ExperienceContractType en = findByLang(existing, LANG_EN);

    String currentSlug = fr.getSlug();
    String nextSlug = SlugUtils.slugify(request.fr().title());
    String codeFr = SlugUtils.slugify(request.fr().title(), LANG_FR);
    String codeEn = SlugUtils.slugify(request.en().title(), LANG_EN);

    if (!currentSlug.equals(nextSlug)) {
      assertSlugAvailable(nextSlug);
    }
    if (!fr.getCode().equals(codeFr)) {
      assertCodeAvailable(codeFr);
    }
    if (!en.getCode().equals(codeEn)) {
      assertCodeAvailable(codeEn);
    }

    updateLocale(fr, nextSlug, codeFr, LANG_FR, request.fr());
    updateLocale(en, nextSlug, codeEn, LANG_EN, request.en());
    repository.saveAndFlush(fr);
    repository.saveAndFlush(en);

    return toDetail(List.of(fr, en));
  }

  @Transactional
  public void deleteContractType(UUID id) {
    currentUserService.requireAdmin();
    List<ExperienceContractType> items = getGroup(id);

    for (ExperienceContractType item : items) {
      if (item.getDeactivatedAt() == null) {
        throw new ApiException(HttpStatus.BAD_REQUEST, NOT_DEACTIVATED_CODE, NOT_DEACTIVATED_MESSAGE);
      }
    }

    List<UUID> ids = items.stream().map(ExperienceContractType::getId).toList();
    if (experienceRepository.existsByContractTypeIdInAndDeletedAtIsNull(ids)) {
      throw new ApiException(HttpStatus.CONFLICT, IN_USE_CODE, IN_USE_MESSAGE);
    }

    repository.deleteAll(items);
  }

  @Transactional
  public void deactivateContractType(UUID id) {
    currentUserService.requireAdmin();
    for (ExperienceContractType item : getGroup(id)) {
      if (item.getDeactivatedAt() == null) {
        item.markDeactivated();
      }
      repository.save(item);
    }
  }

  @Transactional
  public void reactivateContractType(UUID id) {
    currentUserService.requireAdmin();
    for (ExperienceContractType item : getGroup(id)) {
      if (item.getDeactivatedAt() != null) {
        item.reactivate();
      }
      repository.save(item);
    }
  }

  private ExperienceContractTypeAdminListItem toListItem(String slug) {
    List<ExperienceContractType> items = repository.findBySlugAndDeletedAtIsNull(slug);
    ExperienceContractType fr = findByLangOrNull(items, LANG_FR);
    ExperienceContractType en = findByLangOrNull(items, LANG_EN);
    UUID id = fr != null ? fr.getId() : en != null ? en.getId() : null;

    Instant createdAt = items
      .stream()
      .map(ExperienceContractType::getCreatedAt)
      .filter(Objects::nonNull)
      .min(Comparator.naturalOrder())
      .orElse(null);
    Instant updatedAt = items
      .stream()
      .map(ExperienceContractType::getUpdatedAt)
      .filter(Objects::nonNull)
      .max(Comparator.naturalOrder())
      .orElse(null);

    return new ExperienceContractTypeAdminListItem(
      id,
      slug,
      fr != null ? fr.getCode() : "",
      en != null ? en.getCode() : "",
      fr != null ? fr.getTitle() : "",
      en != null ? en.getTitle() : "",
      createdAt,
      updatedAt,
      fr != null ? fr.getDeactivatedAt() : en != null ? en.getDeactivatedAt() : null
    );
  }

  private ExperienceContractTypeAdminDetail toDetail(List<ExperienceContractType> items) {
    ExperienceContractType fr = findByLang(items, LANG_FR);
    ExperienceContractType en = findByLang(items, LANG_EN);

    return new ExperienceContractTypeAdminDetail(
      fr.getId(),
      fr.getSlug(),
      fr.getCode(),
      en.getCode(),
      new ExperienceContractTypeLocaleRequest(fr.getTitle()),
      new ExperienceContractTypeLocaleRequest(en.getTitle())
    );
  }

  private ExperienceContractType createLocale(
    String slug,
    String code,
    String lang,
    ExperienceContractTypeLocaleRequest locale
  ) {
    return repository.saveAndFlush(
      new ExperienceContractType(slug, code, locale.title().trim(), lang)
    );
  }

  private void updateLocale(
    ExperienceContractType item,
    String slug,
    String code,
    String lang,
    ExperienceContractTypeLocaleRequest locale
  ) {
    item.updateDetails(slug, code, locale.title().trim(), lang);
  }

  private void assertSlugAvailable(String slug) {
    if (
      repository.existsBySlugAndLangAndDeletedAtIsNull(slug, LANG_FR) ||
      repository.existsBySlugAndLangAndDeletedAtIsNull(slug, LANG_EN)
    ) {
      throw conflict(SLUG_EXISTS_CODE, SLUG_EXISTS_MESSAGE);
    }
  }

  private void assertCodeAvailable(String code) {
    if (repository.existsByCodeAndDeletedAtIsNull(code)) {
      throw conflict(CODE_EXISTS_CODE, CODE_EXISTS_MESSAGE);
    }
  }

  private List<ExperienceContractType> getGroup(UUID id) {
    ExperienceContractType item = repository
      .findByIdAndDeletedAtIsNull(id)
      .orElseThrow(ExperienceContractTypeAdminService::notFound);

    return getGroup(item.getSlug());
  }

  private List<ExperienceContractType> getGroup(String slug) {
    List<ExperienceContractType> items = repository.findBySlugAndDeletedAtIsNull(slug);
    if (items.isEmpty() || !hasLang(items, LANG_FR) || !hasLang(items, LANG_EN)) {
      throw notFound();
    }

    return items;
  }

  private static boolean hasLang(List<ExperienceContractType> items, String lang) {
    return items.stream().anyMatch(item -> lang.equals(item.getLang()));
  }

  private static ExperienceContractType findByLang(
    List<ExperienceContractType> items,
    String lang
  ) {
    return items
      .stream()
      .filter(item -> lang.equals(item.getLang()))
      .findFirst()
      .orElseThrow(ExperienceContractTypeAdminService::notFound);
  }

  private static ExperienceContractType findByLangOrNull(
    List<ExperienceContractType> items,
    String lang
  ) {
    return items
      .stream()
      .filter(item -> lang.equals(item.getLang()))
      .findFirst()
      .orElse(null);
  }

  private static ApiException notFound() {
    return new ApiException(HttpStatus.NOT_FOUND, NOT_FOUND_CODE, NOT_FOUND_MESSAGE);
  }

  private static ApiException conflict(String code, String message) {
    return new ApiException(HttpStatus.CONFLICT, code, message);
  }
}
