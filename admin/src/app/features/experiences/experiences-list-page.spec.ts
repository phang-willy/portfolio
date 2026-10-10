import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminAccessService } from '@/app/core/auth/admin-access.service';
import { ExperienceService } from '@/app/features/experiences/experience.service';
import { ExperiencesListPage } from '@/app/features/experiences/experiences-list-page';
import { ExperienceAdminListItem } from '@/app/shared/models/experience.model';
import { provideAdminIcons } from '@/app/shared/icons/admin-icons';

type ExperiencesListPageHarness = ExperiencesListPage & {
  deleteForm: ExperiencesListPage['deleteForm'];
  deactivateForm: ExperiencesListPage['deactivateForm'];
  acceptDelete(): void;
  acceptDeactivate(): void;
  confirmDelete(item: ExperienceAdminListItem): void;
  confirmDeactivate(item: ExperienceAdminListItem): void;
  deleteTarget(): ExperienceAdminListItem | null;
  deactivateTarget(): ExperienceAdminListItem | null;
  contractTypeLabel(item: ExperienceAdminListItem): string;
};

const ITEM: ExperienceAdminListItem = {
  id: 'exp-id',
  company: 'Logistib',
  roleFr: 'Intégrateur Web',
  contractTypeFr: 'Alternance',
  contractTypeEn: 'Work-study',
  yearStart: 2020,
  yearEnd: 2022,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deactivatedAt: null,
};

const EMPTY_PAGE = {
  data: [] as ExperienceAdminListItem[],
  pagination: {
    page: 0,
    size: 50,
    totalItems: 0,
    totalPages: 0,
  },
};

describe('ExperiencesListPage honeypot', () => {
  const getExperiences = vi.fn();
  const deleteExperience = vi.fn();
  const deactivateExperience = vi.fn();
  const reactivateExperience = vi.fn();

  beforeEach(async () => {
    getExperiences.mockReset();
    deleteExperience.mockReset();
    deactivateExperience.mockReset();
    reactivateExperience.mockReset();
    getExperiences.mockReturnValue(of(EMPTY_PAGE));

    await TestBed.configureTestingModule({
      imports: [ExperiencesListPage],
      providers: [
        provideAdminIcons(),
        provideRouter([]),
        {
          provide: ExperienceService,
          useValue: {
            getExperiences,
            deleteExperience,
            deactivateExperience,
            reactivateExperience,
          },
        },
        {
          provide: AdminAccessService,
          useValue: { isAdmin: () => true },
        },
      ],
    }).compileComponents();
  });

  function createHarness(): ExperiencesListPageHarness {
    const fixture = TestBed.createComponent(ExperiencesListPage);
    fixture.detectChanges();
    return fixture.componentInstance as ExperiencesListPageHarness;
  }

  it('formats contract type as french / english', () => {
    const component = createHarness();
    expect(component.contractTypeLabel(ITEM)).toBe('Alternance / Work-study');
  });

  it('does not deactivate when the honeypot is filled', () => {
    const component = createHarness();
    component.confirmDeactivate(ITEM);
    component.deactivateForm.setValue({ website: 'spam' });

    component.acceptDeactivate();

    expect(deactivateExperience).not.toHaveBeenCalled();
    expect(component.deactivateTarget()).toBeNull();
  });

  it('deactivates when the honeypot stays empty', () => {
    deactivateExperience.mockReturnValue(of(void 0));
    const component = createHarness();
    component.confirmDeactivate(ITEM);
    component.deactivateForm.setValue({ website: '' });

    component.acceptDeactivate();

    expect(deactivateExperience).toHaveBeenCalledWith('exp-id', { website: '' });
  });

  it('does not delete when the honeypot is filled', () => {
    const component = createHarness();
    component.confirmDelete({ ...ITEM, deactivatedAt: '2026-01-02T00:00:00.000Z' });
    component.deleteForm.setValue({ website: 'spam' });

    component.acceptDelete();

    expect(deleteExperience).not.toHaveBeenCalled();
    expect(component.deleteTarget()).toBeNull();
  });

  it('deletes when the honeypot stays empty', () => {
    deleteExperience.mockReturnValue(of(void 0));
    const component = createHarness();
    const deactivated = { ...ITEM, deactivatedAt: '2026-01-02T00:00:00.000Z' };
    component.confirmDelete(deactivated);
    component.deleteForm.setValue({ website: '' });

    component.acceptDelete();

    expect(deleteExperience).toHaveBeenCalledWith('exp-id', { website: '' });
  });
});
