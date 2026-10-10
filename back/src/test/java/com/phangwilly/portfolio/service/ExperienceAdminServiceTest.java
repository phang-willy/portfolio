package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.dto.ExperienceAdminDetail;
import com.phangwilly.portfolio.dto.ExperienceAdminRequest;
import com.phangwilly.portfolio.dto.ExperienceLocaleRequest;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.model.AuditableEntity;
import com.phangwilly.portfolio.model.Experience;
import com.phangwilly.portfolio.repository.ExperienceContractTypeRepository;
import com.phangwilly.portfolio.repository.ExperienceRepository;
import com.phangwilly.portfolio.security.AuthenticatedUser;
import com.phangwilly.portfolio.security.CurrentUserService;
import com.phangwilly.portfolio.enums.UserRole;
import java.lang.reflect.Field;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class ExperienceAdminServiceTest {

  @Mock
  private ExperienceRepository experienceRepository;

  @Mock
  private ExperienceContractTypeRepository contractTypeRepository;

  @Mock
  private CurrentUserService currentUserService;

  private ExperienceAdminService service;

  @BeforeEach
  void setUp() {
    service = new ExperienceAdminService(
      experienceRepository,
      contractTypeRepository,
      currentUserService
    );
  }

  @Test
  void buildLocaleSlugUsesCompanyRoleYearsAndLang() {
    assertThat(
        ExperienceAdminService.buildLocaleSlug(
          "Logistib",
          "Intégrateur Web",
          (short) 2020,
          (short) 2022,
          "fr"
        )
      )
      .isEqualTo("logistib-integrateur-web-2020-2022-fr");
  }

  @Test
  void buildLocaleSlugOmitsYearEndWhenNull() {
    assertThat(ExperienceAdminService.buildLocaleSlug("Acme", "Developer", (short) 2024, null, "en"))
      .isEqualTo("acme-developer-2024-en");
  }

  @Test
  void buildLocaleSlugKeepsIdenticalRolesDistinctPerLang() {
    assertThat(ExperienceAdminService.buildLocaleSlug("Acme", "Developer", (short) 2024, null, "fr"))
      .isEqualTo("acme-developer-2024-fr");
    assertThat(ExperienceAdminService.buildLocaleSlug("Acme", "Developer", (short) 2024, null, "en"))
      .isEqualTo("acme-developer-2024-en");
  }

  @Test
  void buildLocaleSlugRespectsColumnLimit() {
    String company = "a".repeat(200);
    String role = "b".repeat(200);
    String slug = ExperienceAdminService.buildLocaleSlug(company, role, (short) 2020, (short) 2022, "fr");

    assertThat(slug).hasSizeLessThanOrEqualTo(255);
    assertThat(slug).endsWith("-fr");
  }

  @Test
  void createExperienceSucceedsWhenRolesSlugifyIdentically() {
    when(currentUserService.requireAdmin())
      .thenReturn(new AuthenticatedUser(UUID.randomUUID(), "admin@example.com", UserRole.ADMIN, "hash"));
    when(experienceRepository.findBySlugAndDeletedAtIsNull(any())).thenReturn(Optional.empty());
    when(experienceRepository.saveAndFlush(any(Experience.class))).thenAnswer(invocation ->
      invocation.getArgument(0)
    );

    ExperienceAdminRequest request = new ExperienceAdminRequest(
      "Acme",
      (short) 2024,
      null,
      null,
      new ExperienceLocaleRequest("Developer", "", ""),
      new ExperienceLocaleRequest("Developer", "", ""),
      null
    );

    ExperienceAdminDetail detail = service.createExperience(request);

    assertThat(detail.slugFr()).isEqualTo("acme-developer-2024-fr");
    assertThat(detail.slugEn()).isEqualTo("acme-developer-2024-en");
    assertThat(detail.slugFr()).isNotEqualTo(detail.slugEn());
  }

  @Test
  void createExperienceRequiresAdminRole() {
    when(currentUserService.requireAdmin())
      .thenThrow(new ApiException(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Access denied"));

    assertThatThrownBy(() -> service.createExperience(sampleRequest()))
      .isInstanceOf(ApiException.class)
      .extracting(error -> ((ApiException) error).status())
      .isEqualTo(HttpStatus.FORBIDDEN);

    verifyNoInteractions(experienceRepository);
  }

  @Test
  void createExperiencePersistsFrAndEnWithLocaleSlugs() {
    when(currentUserService.requireAdmin())
      .thenReturn(new AuthenticatedUser(UUID.randomUUID(), "admin@example.com", UserRole.ADMIN, "hash"));
    when(experienceRepository.findBySlugAndDeletedAtIsNull(any())).thenReturn(Optional.empty());
    when(experienceRepository.saveAndFlush(any(Experience.class))).thenAnswer(invocation ->
      invocation.getArgument(0)
    );

    ExperienceAdminDetail detail = service.createExperience(sampleRequest());

    assertThat(detail.company()).isEqualTo("Logistib");
    assertThat(detail.slugFr()).isEqualTo("logistib-integrateur-web-2020-2022-fr");
    assertThat(detail.slugEn()).isEqualTo("logistib-web-integrator-2020-2022-en");
    assertThat(detail.fr().role()).isEqualTo("Intégrateur Web");
    assertThat(detail.en().role()).isEqualTo("Web integrator");
    verify(experienceRepository, org.mockito.Mockito.times(2)).saveAndFlush(any(Experience.class));
  }

  @Test
  void createExperienceRejectsInvalidYears() {
    when(currentUserService.requireAdmin())
      .thenReturn(new AuthenticatedUser(UUID.randomUUID(), "admin@example.com", UserRole.ADMIN, "hash"));

    ExperienceAdminRequest request = new ExperienceAdminRequest(
      "Acme",
      (short) 2024,
      (short) 2020,
      null,
      new ExperienceLocaleRequest("Dev", "", ""),
      new ExperienceLocaleRequest("Dev", "", ""),
      null
    );

    assertThatThrownBy(() -> service.createExperience(request))
      .isInstanceOf(ApiException.class)
      .satisfies(error -> {
        ApiException apiError = (ApiException) error;
        assertThat(apiError.status()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(apiError.code()).isEqualTo("EXPERIENCE_INVALID_YEARS");
      });

    verify(experienceRepository, never()).saveAndFlush(any());
  }

  @Test
  void deleteExperienceRequiresDeactivation() throws Exception {
    UUID groupId = UUID.randomUUID();
    UUID frId = UUID.randomUUID();
    Experience fr = new Experience(
      groupId,
      "acme-dev-2020-fr",
      (short) 2020,
      null,
      "Dev",
      "Acme",
      null,
      null,
      null,
      "fr"
    );
    Experience en = new Experience(
      groupId,
      "acme-dev-2020-en",
      (short) 2020,
      null,
      "Dev",
      "Acme",
      null,
      null,
      null,
      "en"
    );
    setId(fr, frId);
    setId(en, UUID.randomUUID());

    when(currentUserService.requireAdmin())
      .thenReturn(new AuthenticatedUser(UUID.randomUUID(), "admin@example.com", UserRole.ADMIN, "hash"));
    when(experienceRepository.findByIdAndDeletedAtIsNull(frId)).thenReturn(Optional.of(fr));
    when(experienceRepository.findByGroupIdAndDeletedAtIsNull(groupId)).thenReturn(List.of(fr, en));

    assertThatThrownBy(() -> service.deleteExperience(frId))
      .isInstanceOf(ApiException.class)
      .satisfies(error -> {
        ApiException apiError = (ApiException) error;
        assertThat(apiError.status()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(apiError.code()).isEqualTo("EXPERIENCE_NOT_DEACTIVATED");
      });

    verify(experienceRepository, never()).deleteAll(any());
  }

  @Test
  void deleteExperienceDeletesWhenDeactivated() throws Exception {
    UUID groupId = UUID.randomUUID();
    UUID frId = UUID.randomUUID();
    Experience fr = new Experience(
      groupId,
      "acme-dev-2020-fr",
      (short) 2020,
      null,
      "Dev",
      "Acme",
      null,
      null,
      null,
      "fr"
    );
    Experience en = new Experience(
      groupId,
      "acme-dev-2020-en",
      (short) 2020,
      null,
      "Dev",
      "Acme",
      null,
      null,
      null,
      "en"
    );
    fr.markDeactivated();
    en.markDeactivated();
    setId(fr, frId);
    setId(en, UUID.randomUUID());

    when(currentUserService.requireAdmin())
      .thenReturn(new AuthenticatedUser(UUID.randomUUID(), "admin@example.com", UserRole.ADMIN, "hash"));
    when(experienceRepository.findByIdAndDeletedAtIsNull(frId)).thenReturn(Optional.of(fr));
    when(experienceRepository.findByGroupIdAndDeletedAtIsNull(groupId)).thenReturn(List.of(fr, en));

    service.deleteExperience(frId);

    verify(experienceRepository).deleteAll(List.of(fr, en));
  }

  private static ExperienceAdminRequest sampleRequest() {
    return new ExperienceAdminRequest(
      "Logistib",
      (short) 2020,
      (short) 2022,
      null,
      new ExperienceLocaleRequest("Intégrateur Web", "Résumé", "<p>FR</p>"),
      new ExperienceLocaleRequest("Web integrator", "Summary", "<p>EN</p>"),
      null
    );
  }

  private static void setId(AuditableEntity entity, UUID id) throws Exception {
    Field field = AuditableEntity.class.getDeclaredField("id");
    field.setAccessible(true);
    field.set(entity, id);
  }
}
