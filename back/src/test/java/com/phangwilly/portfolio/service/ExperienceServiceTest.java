package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.dto.ExperienceResponse;
import com.phangwilly.portfolio.dto.PageResponse;
import com.phangwilly.portfolio.model.Experience;
import com.phangwilly.portfolio.model.ExperienceContractType;
import com.phangwilly.portfolio.repository.ExperienceRepository;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ExperienceServiceTest {

  @Mock
  private ExperienceRepository experienceRepository;

  private ExperienceService service;

  @BeforeEach
  void setUp() {
    service = new ExperienceService(experienceRepository);
  }

  @Test
  void getExperiencesReturnsEmptyPageWhenNothingIsPublic() {
    when(experienceRepository.findPublicExperiences()).thenReturn(List.of());

    PageResponse<ExperienceResponse> page = service.getExperiences(0, 50);

    assertThat(page.data()).isEmpty();
    assertThat(page.pagination().totalItems()).isZero();
    assertThat(page.pagination().totalPages()).isZero();
  }

  @Test
  void getExperiencesGroupsLocalesAndKeepsOpenEndedExperience() {
    UUID groupId = UUID.randomUUID();
    ExperienceContractType frContract = new ExperienceContractType(
      "alternance",
      "alternance",
      "Contrat en alternance",
      "fr"
    );
    ExperienceContractType enContract = new ExperienceContractType(
      "alternance",
      "alternance",
      "Work-study contract",
      "en"
    );
    Experience fr = experience(groupId, "fr", "DIT", (short) 2024, null, "Développeur", "Résumé", frContract);
    Experience en = experience(groupId, "en", "DIT", (short) 2024, null, "Developer", "Summary", enContract);

    when(experienceRepository.findPublicExperiences()).thenReturn(List.of(en, fr));

    PageResponse<ExperienceResponse> page = service.getExperiences(null, null);

    assertThat(page.data()).hasSize(1);
    ExperienceResponse response = page.data().getFirst();
    assertThat(response.id()).isEqualTo(groupId);
    assertThat(response.company()).isEqualTo("DIT");
    assertThat(response.yearStart()).isEqualTo((short) 2024);
    assertThat(response.yearEnd()).isNull();
    assertThat(response.fr().role()).isEqualTo("Développeur");
    assertThat(response.fr().contractType()).isEqualTo("Contrat en alternance");
    assertThat(response.en().role()).isEqualTo("Developer");
    assertThat(response.en().contractType()).isEqualTo("Work-study contract");
  }

  @Test
  void getExperiencesSortsFinishedExperienceAfterOngoingOne() {
    UUID ongoingId = UUID.randomUUID();
    UUID finishedId = UUID.randomUUID();
    Experience ongoing = experience(ongoingId, "fr", "Now", (short) 2025, null, "Role", "Now", null);
    Experience finished = experience(finishedId, "fr", "Then", (short) 2025, (short) 2026, "Role", "Then", null);

    when(experienceRepository.findPublicExperiences()).thenReturn(List.of(finished, ongoing));

    PageResponse<ExperienceResponse> page = service.getExperiences(0, 50);

    assertThat(page.data()).extracting(ExperienceResponse::company).containsExactly("Now", "Then");
    assertThat(page.data().get(1).yearEnd()).isEqualTo((short) 2026);
  }

  private static Experience experience(
    UUID groupId,
    String lang,
    String company,
    Short yearStart,
    Short yearEnd,
    String role,
    String summary,
    ExperienceContractType contractType
  ) {
    return new Experience(
      groupId,
      company + "-" + lang,
      yearStart,
      yearEnd,
      role,
      company,
      summary,
      "",
      contractType,
      lang
    );
  }
}
