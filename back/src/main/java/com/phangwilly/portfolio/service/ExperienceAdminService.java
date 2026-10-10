package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.dto.ExperienceAdminDetail;
import com.phangwilly.portfolio.dto.ExperienceAdminListItem;
import com.phangwilly.portfolio.dto.ExperienceAdminRequest;
import com.phangwilly.portfolio.dto.ExperienceLocaleRequest;
import com.phangwilly.portfolio.dto.PageResponse;
import com.phangwilly.portfolio.dto.PaginationRequest;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.model.Experience;
import com.phangwilly.portfolio.model.ExperienceContractType;
import com.phangwilly.portfolio.repository.ExperienceContractTypeRepository;
import com.phangwilly.portfolio.repository.ExperienceRepository;
import com.phangwilly.portfolio.security.CurrentUserService;
import com.phangwilly.portfolio.util.SlugUtils;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExperienceAdminService {

  private static final String NOT_FOUND_CODE = "EXPERIENCE_NOT_FOUND";
  private static final String NOT_FOUND_MESSAGE = "Experience not found";
  private static final String SLUG_EXISTS_CODE = "EXPERIENCE_SLUG_EXISTS";
  private static final String SLUG_EXISTS_MESSAGE = "An experience with this slug already exists";
  private static final String CONTRACT_TYPE_NOT_FOUND_CODE = "EXPERIENCE_CONTRACT_TYPE_NOT_FOUND";
  private static final String CONTRACT_TYPE_NOT_FOUND_MESSAGE = "Experience contract type not found";
  private static final String INVALID_YEARS_CODE = "EXPERIENCE_INVALID_YEARS";
  private static final String INVALID_YEARS_MESSAGE = "Year end must be greater than or equal to year start";
  private static final String NOT_DEACTIVATED_CODE = "EXPERIENCE_NOT_DEACTIVATED";
  private static final String NOT_DEACTIVATED_MESSAGE =
    "Experience must be deactivated before it can be permanently deleted";
  private static final String LANG_FR = "fr";
  private static final String LANG_EN = "en";
  private static final int SLUG_MAX_LENGTH = 255;
  private static final Sort GROUP_SORT = Sort.by(Sort.Direction.ASC, "groupId");

  private final ExperienceRepository experienceRepository;
  private final ExperienceContractTypeRepository contractTypeRepository;
  private final CurrentUserService currentUserService;

  public ExperienceAdminService(
    ExperienceRepository experienceRepository,
    ExperienceContractTypeRepository contractTypeRepository,
    CurrentUserService currentUserService
  ) {
    this.experienceRepository = experienceRepository;
    this.contractTypeRepository = contractTypeRepository;
    this.currentUserService = currentUserService;
  }

  @Transactional(readOnly = true)
  public PageResponse<ExperienceAdminListItem> getExperiences(Integer page, Integer size) {
    PaginationRequest paginationRequest = PaginationRequest.of(page, size);
    Page<UUID> groupPage = experienceRepository.findDistinctActiveGroupIds(
      paginationRequest.toPageable(GROUP_SORT)
    );

    List<ExperienceAdminListItem> items = groupPage
      .getContent()
      .stream()
      .map(this::toListItem)
      .toList();

    return new PageResponse<>(
      items,
      new PageResponse.Pagination(
        groupPage.getNumber(),
        groupPage.getSize(),
        groupPage.getTotalElements(),
        groupPage.getTotalPages()
      )
    );
  }

  @Transactional(readOnly = true)
  public ExperienceAdminDetail getExperience(UUID id) {
    return toDetail(getGroup(id));
  }

  @Transactional
  public ExperienceAdminDetail createExperience(ExperienceAdminRequest request) {
    currentUserService.requireAdmin();
    validateYears(request.yearStart(), request.yearEnd());

    String company = request.company().trim();
    String slugFr = buildLocaleSlug(
      company,
      request.fr().role(),
      request.yearStart(),
      request.yearEnd(),
      LANG_FR
    );
    String slugEn = buildLocaleSlug(
      company,
      request.en().role(),
      request.yearStart(),
      request.yearEnd(),
      LANG_EN
    );
    assertSlugAvailable(slugFr, null);
    assertSlugAvailable(slugEn, null);

    List<ExperienceContractType> contractTypes = resolveContractTypes(request.contractTypeId());
    UUID groupId = UUID.randomUUID();

    Experience fr = createLocale(
      groupId,
      slugFr,
      request,
      company,
      LANG_FR,
      request.fr(),
      findContractType(contractTypes, LANG_FR)
    );
    Experience en = createLocale(
      groupId,
      slugEn,
      request,
      company,
      LANG_EN,
      request.en(),
      findContractType(contractTypes, LANG_EN)
    );

    return toDetail(List.of(fr, en));
  }

  @Transactional
  public ExperienceAdminDetail updateExperience(UUID id, ExperienceAdminRequest request) {
    List<Experience> existing = getGroup(id);
    validateYears(request.yearStart(), request.yearEnd());

    Experience fr = findByLang(existing, LANG_FR);
    Experience en = findByLang(existing, LANG_EN);
    String company = request.company().trim();
    String slugFr = buildLocaleSlug(
      company,
      request.fr().role(),
      request.yearStart(),
      request.yearEnd(),
      LANG_FR
    );
    String slugEn = buildLocaleSlug(
      company,
      request.en().role(),
      request.yearStart(),
      request.yearEnd(),
      LANG_EN
    );

    assertSlugAvailable(slugFr, fr.getId());
    assertSlugAvailable(slugEn, en.getId());

    List<ExperienceContractType> contractTypes = resolveContractTypes(request.contractTypeId());
    updateLocale(fr, slugFr, request, company, LANG_FR, request.fr(), findContractType(contractTypes, LANG_FR));
    updateLocale(en, slugEn, request, company, LANG_EN, request.en(), findContractType(contractTypes, LANG_EN));
    experienceRepository.saveAndFlush(fr);
    experienceRepository.saveAndFlush(en);

    return toDetail(List.of(fr, en));
  }

  @Transactional
  public void deleteExperience(UUID id) {
    currentUserService.requireAdmin();
    List<Experience> experiences = getGroup(id);

    for (Experience experience : experiences) {
      if (experience.getDeactivatedAt() == null) {
        throw new ApiException(HttpStatus.BAD_REQUEST, NOT_DEACTIVATED_CODE, NOT_DEACTIVATED_MESSAGE);
      }
    }

    experienceRepository.deleteAll(experiences);
  }

  @Transactional
  public void deactivateExperience(UUID id) {
    currentUserService.requireAdmin();
    for (Experience experience : getGroup(id)) {
      if (experience.getDeactivatedAt() == null) {
        experience.markDeactivated();
      }
      experienceRepository.save(experience);
    }
  }

  @Transactional
  public void reactivateExperience(UUID id) {
    currentUserService.requireAdmin();
    for (Experience experience : getGroup(id)) {
      if (experience.getDeactivatedAt() != null) {
        experience.reactivate();
      }
      experienceRepository.save(experience);
    }
  }

  private ExperienceAdminListItem toListItem(UUID groupId) {
    List<Experience> experiences = experienceRepository.findByGroupIdAndDeletedAtIsNull(groupId);
    Experience fr = findByLangOrNull(experiences, LANG_FR);
    Experience en = findByLangOrNull(experiences, LANG_EN);
    UUID id = fr != null ? fr.getId() : en != null ? en.getId() : null;

    Instant createdAt = experiences
      .stream()
      .map(Experience::getCreatedAt)
      .filter(Objects::nonNull)
      .min(Comparator.naturalOrder())
      .orElse(null);
    Instant updatedAt = experiences
      .stream()
      .map(Experience::getUpdatedAt)
      .filter(Objects::nonNull)
      .max(Comparator.naturalOrder())
      .orElse(null);

    Experience primary = fr != null ? fr : en;

    return new ExperienceAdminListItem(
      id,
      primary != null ? primary.getCompany() : "",
      fr != null ? fr.getRole() : "",
      contractTypeTitle(fr),
      contractTypeTitle(en),
      primary != null ? primary.getYearStart() : null,
      primary != null ? primary.getYearEnd() : null,
      createdAt,
      updatedAt,
      primary != null ? primary.getDeactivatedAt() : null
    );
  }

  private ExperienceAdminDetail toDetail(List<Experience> experiences) {
    Experience fr = findByLang(experiences, LANG_FR);
    Experience en = findByLang(experiences, LANG_EN);
    UUID contractTypeId = fr.getContractType() != null
      ? fr.getContractType().getId()
      : en.getContractType() != null ? en.getContractType().getId() : null;

    return new ExperienceAdminDetail(
      fr.getId(),
      fr.getCompany(),
      fr.getYearStart(),
      fr.getYearEnd(),
      contractTypeId,
      fr.getSlug(),
      en.getSlug(),
      toLocaleRequest(fr),
      toLocaleRequest(en)
    );
  }

  private static ExperienceLocaleRequest toLocaleRequest(Experience experience) {
    return new ExperienceLocaleRequest(
      experience.getRole(),
      experience.getSummary(),
      experience.getContent()
    );
  }

  private Experience createLocale(
    UUID groupId,
    String slug,
    ExperienceAdminRequest request,
    String company,
    String lang,
    ExperienceLocaleRequest locale,
    ExperienceContractType contractType
  ) {
    return experienceRepository.saveAndFlush(
      new Experience(
        groupId,
        slug,
        request.yearStart(),
        request.yearEnd(),
        locale.role().trim(),
        company,
        normalizeOptional(locale.summary()),
        normalizeOptional(locale.content()),
        contractType,
        lang
      )
    );
  }

  private void updateLocale(
    Experience experience,
    String slug,
    ExperienceAdminRequest request,
    String company,
    String lang,
    ExperienceLocaleRequest locale,
    ExperienceContractType contractType
  ) {
    experience.updateDetails(
      slug,
      request.yearStart(),
      request.yearEnd(),
      locale.role().trim(),
      company,
      normalizeOptional(locale.summary()),
      normalizeOptional(locale.content()),
      contractType,
      lang
    );
  }

  private List<ExperienceContractType> resolveContractTypes(UUID contractTypeId) {
    if (contractTypeId == null) {
      return List.of();
    }

    ExperienceContractType seed = contractTypeRepository
      .findByIdAndDeletedAtIsNull(contractTypeId)
      .orElseThrow(() ->
        new ApiException(
          HttpStatus.NOT_FOUND,
          CONTRACT_TYPE_NOT_FOUND_CODE,
          CONTRACT_TYPE_NOT_FOUND_MESSAGE
        )
      );

    List<ExperienceContractType> group = contractTypeRepository.findBySlugAndDeletedAtIsNull(
      seed.getSlug()
    );
    if (group.isEmpty() || !hasContractLang(group, LANG_FR) || !hasContractLang(group, LANG_EN)) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        CONTRACT_TYPE_NOT_FOUND_CODE,
        CONTRACT_TYPE_NOT_FOUND_MESSAGE
      );
    }

    return group;
  }

  private static ExperienceContractType findContractType(
    List<ExperienceContractType> contractTypes,
    String lang
  ) {
    if (contractTypes.isEmpty()) {
      return null;
    }

    return contractTypes
      .stream()
      .filter(item -> lang.equals(item.getLang()))
      .findFirst()
      .orElse(null);
  }

  private static boolean hasContractLang(List<ExperienceContractType> items, String lang) {
    return items.stream().anyMatch(item -> lang.equals(item.getLang()));
  }

  private static String contractTypeTitle(Experience experience) {
    if (experience == null || experience.getContractType() == null) {
      return "";
    }

    return experience.getContractType().getTitle();
  }

  private void assertSlugAvailable(String slug, UUID currentId) {
    if (slug == null || slug.isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "EXPERIENCE_INVALID_SLUG", "Slug is required");
    }

    Optional<Experience> existing = experienceRepository.findBySlugAndDeletedAtIsNull(slug);
    if (existing.isEmpty()) {
      return;
    }

    if (currentId != null && existing.get().getId().equals(currentId)) {
      return;
    }

    throw conflict(SLUG_EXISTS_CODE, SLUG_EXISTS_MESSAGE);
  }

  private List<Experience> getGroup(UUID id) {
    Experience experience = experienceRepository
      .findByIdAndDeletedAtIsNull(id)
      .orElseThrow(ExperienceAdminService::notFound);

    return getGroupByGroupId(experience.getGroupId());
  }

  private List<Experience> getGroupByGroupId(UUID groupId) {
    List<Experience> experiences = experienceRepository.findByGroupIdAndDeletedAtIsNull(groupId);
    if (experiences.isEmpty() || !hasLang(experiences, LANG_FR) || !hasLang(experiences, LANG_EN)) {
      throw notFound();
    }

    return experiences;
  }

  private static boolean hasLang(List<Experience> experiences, String lang) {
    return experiences.stream().anyMatch(experience -> lang.equals(experience.getLang()));
  }

  private static Experience findByLang(List<Experience> experiences, String lang) {
    return experiences
      .stream()
      .filter(experience -> lang.equals(experience.getLang()))
      .findFirst()
      .orElseThrow(ExperienceAdminService::notFound);
  }

  private static Experience findByLangOrNull(List<Experience> experiences, String lang) {
    return experiences
      .stream()
      .filter(experience -> lang.equals(experience.getLang()))
      .findFirst()
      .orElse(null);
  }

  private static void validateYears(Short yearStart, Short yearEnd) {
    if (yearEnd != null && yearEnd < yearStart) {
      throw new ApiException(HttpStatus.BAD_REQUEST, INVALID_YEARS_CODE, INVALID_YEARS_MESSAGE);
    }
  }

  static String buildLocaleSlug(
    String company,
    String role,
    Short yearStart,
    Short yearEnd,
    String lang
  ) {
    StringBuilder raw = new StringBuilder()
      .append(company == null ? "" : company.trim())
      .append('-')
      .append(role == null ? "" : role.trim())
      .append('-')
      .append(yearStart);

    if (yearEnd != null) {
      raw.append('-').append(yearEnd);
    }

    String base = SlugUtils.slugify(raw.toString());
    String suffix = "-" + SlugUtils.slugify(lang == null ? "" : lang);
    if (suffix.equals("-")) {
      return truncateSlug(base);
    }

    int maxBaseLength = SLUG_MAX_LENGTH - suffix.length();
    if (maxBaseLength < 1) {
      return truncateSlug(SlugUtils.slugify(lang));
    }

    return truncateSlug(base, maxBaseLength) + suffix;
  }

  private static String truncateSlug(String slug) {
    return truncateSlug(slug, SLUG_MAX_LENGTH);
  }

  private static String truncateSlug(String slug, int maxLength) {
    if (slug == null || slug.isEmpty()) {
      return "";
    }

    if (slug.length() <= maxLength) {
      return slug;
    }

    return slug.substring(0, maxLength).replaceAll("-+$", "");
  }

  private static String normalizeOptional(String value) {
    if (value == null) {
      return null;
    }

    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }

  private static ApiException notFound() {
    return new ApiException(HttpStatus.NOT_FOUND, NOT_FOUND_CODE, NOT_FOUND_MESSAGE);
  }

  private static ApiException conflict(String code, String message) {
    return new ApiException(HttpStatus.CONFLICT, code, message);
  }
}
