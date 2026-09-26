package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.dto.ExperiencePublicLocale;
import com.phangwilly.portfolio.dto.ExperienceResponse;
import com.phangwilly.portfolio.dto.PageResponse;
import com.phangwilly.portfolio.dto.PaginationRequest;
import com.phangwilly.portfolio.model.Experience;
import com.phangwilly.portfolio.repository.ExperienceRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExperienceService {

  private static final String LANG_FR = "fr";
  private static final String LANG_EN = "en";

  private final ExperienceRepository experienceRepository;

  public ExperienceService(ExperienceRepository experienceRepository) {
    this.experienceRepository = experienceRepository;
  }

  /**
   * Public experiences grouped by group id (FR + EN), including contract type titles.
   * Loaded in one query, then paginated in memory.
   */
  @Transactional(readOnly = true)
  public PageResponse<ExperienceResponse> getExperiences(Integer page, Integer size) {
    Map<UUID, List<Experience>> experiencesByGroup = new LinkedHashMap<>();
    for (Experience experience : experienceRepository.findPublicExperiences()) {
      experiencesByGroup.computeIfAbsent(experience.getGroupId(), key -> new ArrayList<>()).add(experience);
    }

    List<ExperienceResponse> experiences = experiencesByGroup
      .entrySet()
      .stream()
      .map(entry -> toResponse(entry.getKey(), entry.getValue()))
      .filter(experience -> experience != null)
      .sorted(
        Comparator
          .comparing(ExperienceResponse::yearStart, Comparator.nullsLast(Comparator.reverseOrder()))
          .thenComparing(ExperienceResponse::yearEnd, Comparator.nullsFirst(Comparator.reverseOrder()))
          .thenComparing(ExperienceResponse::company, String.CASE_INSENSITIVE_ORDER)
      )
      .toList();

    return paginate(experiences, page, size);
  }

  private static ExperienceResponse toResponse(UUID groupId, List<Experience> locales) {
    Experience fr = findByLang(locales, LANG_FR);
    Experience en = findByLang(locales, LANG_EN);
    Experience primary = fr != null ? fr : en;
    if (primary == null || primary.getYearStart() == null) {
      return null;
    }

    return new ExperienceResponse(
      groupId,
      primary.getCompany(),
      primary.getYearStart(),
      primary.getYearEnd(),
      ExperiencePublicLocale.from(fr),
      ExperiencePublicLocale.from(en)
    );
  }

  private static Experience findByLang(List<Experience> experiences, String lang) {
    return experiences
      .stream()
      .filter(experience -> lang.equals(experience.getLang()))
      .findFirst()
      .orElse(null);
  }

  private static <T> PageResponse<T> paginate(List<T> items, Integer page, Integer size) {
    PaginationRequest request = PaginationRequest.of(page, size);
    int from = Math.min(request.page() * request.size(), items.size());
    int to = Math.min(from + request.size(), items.size());
    int totalPages = items.isEmpty() ? 0 : (int) Math.ceil((double) items.size() / request.size());

    return new PageResponse<>(
      List.copyOf(items.subList(from, to)),
      new PageResponse.Pagination(request.page(), request.size(), items.size(), totalPages)
    );
  }
}
