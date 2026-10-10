package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.dto.ExperienceContractTypeAdminDetail;
import com.phangwilly.portfolio.dto.ExperienceContractTypeAdminRequest;
import com.phangwilly.portfolio.dto.ExperienceContractTypeLocaleRequest;
import com.phangwilly.portfolio.enums.UserRole;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.model.AuditableEntity;
import com.phangwilly.portfolio.model.ExperienceContractType;
import com.phangwilly.portfolio.repository.ExperienceContractTypeRepository;
import com.phangwilly.portfolio.repository.ExperienceRepository;
import com.phangwilly.portfolio.security.AuthenticatedUser;
import com.phangwilly.portfolio.security.CurrentUserService;
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
class ExperienceContractTypeAdminServiceTest {

  @Mock
  private ExperienceContractTypeRepository repository;

  @Mock
  private ExperienceRepository experienceRepository;

  @Mock
  private CurrentUserService currentUserService;

  private ExperienceContractTypeAdminService service;

  @BeforeEach
  void setUp() {
    service = new ExperienceContractTypeAdminService(
      repository,
      experienceRepository,
      currentUserService
    );
  }

  @Test
  void createContractTypeRequiresAdminRole() {
    when(currentUserService.requireAdmin())
      .thenThrow(new ApiException(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Access denied"));

    assertThatThrownBy(() -> service.createContractType(sampleRequest()))
      .isInstanceOf(ApiException.class)
      .extracting(error -> ((ApiException) error).status())
      .isEqualTo(HttpStatus.FORBIDDEN);

    verifyNoInteractions(repository);
  }

  @Test
  void createContractTypePersistsSharedSlugAndLocaleCodes() {
    when(currentUserService.requireAdmin())
      .thenReturn(new AuthenticatedUser(UUID.randomUUID(), "admin@example.com", UserRole.ADMIN, "hash"));
    when(repository.existsBySlugAndLangAndDeletedAtIsNull("alternance", "fr")).thenReturn(false);
    when(repository.existsBySlugAndLangAndDeletedAtIsNull("alternance", "en")).thenReturn(false);
    when(repository.existsByCodeAndDeletedAtIsNull("alternance-fr")).thenReturn(false);
    when(repository.existsByCodeAndDeletedAtIsNull("work-study-en")).thenReturn(false);
    when(repository.saveAndFlush(any(ExperienceContractType.class))).thenAnswer(invocation ->
      invocation.getArgument(0)
    );

    ExperienceContractTypeAdminDetail detail = service.createContractType(sampleRequest());

    assertThat(detail.slug()).isEqualTo("alternance");
    assertThat(detail.codeFr()).isEqualTo("alternance-fr");
    assertThat(detail.codeEn()).isEqualTo("work-study-en");
    assertThat(detail.fr().title()).isEqualTo("Alternance");
    assertThat(detail.en().title()).isEqualTo("Work-study");
    verify(repository, org.mockito.Mockito.times(2)).saveAndFlush(any(ExperienceContractType.class));
  }

  @Test
  void createContractTypeRejectsDuplicateSlug() {
    when(currentUserService.requireAdmin())
      .thenReturn(new AuthenticatedUser(UUID.randomUUID(), "admin@example.com", UserRole.ADMIN, "hash"));
    when(repository.existsBySlugAndLangAndDeletedAtIsNull("alternance", "fr")).thenReturn(true);

    assertThatThrownBy(() -> service.createContractType(sampleRequest()))
      .isInstanceOf(ApiException.class)
      .satisfies(error -> {
        ApiException apiError = (ApiException) error;
        assertThat(apiError.status()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(apiError.code()).isEqualTo("EXPERIENCE_CONTRACT_TYPE_SLUG_EXISTS");
      });

    verify(repository, never()).saveAndFlush(any());
  }

  @Test
  void deleteContractTypeRequiresDeactivation() throws Exception {
    UUID frId = UUID.randomUUID();
    ExperienceContractType fr = new ExperienceContractType("alternance", "alternance-fr", "Alternance", "fr");
    ExperienceContractType en = new ExperienceContractType("alternance", "work-study-en", "Work-study", "en");
    setId(fr, frId);
    setId(en, UUID.randomUUID());

    when(currentUserService.requireAdmin())
      .thenReturn(new AuthenticatedUser(UUID.randomUUID(), "admin@example.com", UserRole.ADMIN, "hash"));
    when(repository.findByIdAndDeletedAtIsNull(frId)).thenReturn(Optional.of(fr));
    when(repository.findBySlugAndDeletedAtIsNull("alternance")).thenReturn(List.of(fr, en));

    assertThatThrownBy(() -> service.deleteContractType(frId))
      .isInstanceOf(ApiException.class)
      .satisfies(error -> {
        ApiException apiError = (ApiException) error;
        assertThat(apiError.status()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(apiError.code()).isEqualTo("EXPERIENCE_CONTRACT_TYPE_NOT_DEACTIVATED");
      });

    verify(repository, never()).deleteAll(any());
  }

  @Test
  void deleteContractTypeRejectsWhenStillInUse() throws Exception {
    UUID frId = UUID.randomUUID();
    UUID enId = UUID.randomUUID();
    ExperienceContractType fr = new ExperienceContractType("alternance", "alternance-fr", "Alternance", "fr");
    ExperienceContractType en = new ExperienceContractType("alternance", "work-study-en", "Work-study", "en");
    fr.markDeactivated();
    en.markDeactivated();
    setId(fr, frId);
    setId(en, enId);

    when(currentUserService.requireAdmin())
      .thenReturn(new AuthenticatedUser(UUID.randomUUID(), "admin@example.com", UserRole.ADMIN, "hash"));
    when(repository.findByIdAndDeletedAtIsNull(frId)).thenReturn(Optional.of(fr));
    when(repository.findBySlugAndDeletedAtIsNull("alternance")).thenReturn(List.of(fr, en));
    when(experienceRepository.existsByContractTypeIdInAndDeletedAtIsNull(anyCollection())).thenReturn(true);

    assertThatThrownBy(() -> service.deleteContractType(frId))
      .isInstanceOf(ApiException.class)
      .satisfies(error -> {
        ApiException apiError = (ApiException) error;
        assertThat(apiError.status()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(apiError.code()).isEqualTo("EXPERIENCE_CONTRACT_TYPE_IN_USE");
      });

    verify(repository, never()).deleteAll(any());
  }

  @Test
  void deleteContractTypeDeletesWhenDeactivatedAndUnused() throws Exception {
    UUID frId = UUID.randomUUID();
    UUID enId = UUID.randomUUID();
    ExperienceContractType fr = new ExperienceContractType("alternance", "alternance-fr", "Alternance", "fr");
    ExperienceContractType en = new ExperienceContractType("alternance", "work-study-en", "Work-study", "en");
    fr.markDeactivated();
    en.markDeactivated();
    setId(fr, frId);
    setId(en, enId);

    when(currentUserService.requireAdmin())
      .thenReturn(new AuthenticatedUser(UUID.randomUUID(), "admin@example.com", UserRole.ADMIN, "hash"));
    when(repository.findByIdAndDeletedAtIsNull(frId)).thenReturn(Optional.of(fr));
    when(repository.findBySlugAndDeletedAtIsNull("alternance")).thenReturn(List.of(fr, en));
    when(experienceRepository.existsByContractTypeIdInAndDeletedAtIsNull(anyCollection())).thenReturn(false);

    service.deleteContractType(frId);

    verify(repository).deleteAll(List.of(fr, en));
  }

  private static ExperienceContractTypeAdminRequest sampleRequest() {
    return new ExperienceContractTypeAdminRequest(
      new ExperienceContractTypeLocaleRequest("Alternance"),
      new ExperienceContractTypeLocaleRequest("Work-study"),
      null
    );
  }

  private static void setId(AuditableEntity entity, UUID id) throws Exception {
    Field field = AuditableEntity.class.getDeclaredField("id");
    field.setAccessible(true);
    field.set(entity, id);
  }
}
