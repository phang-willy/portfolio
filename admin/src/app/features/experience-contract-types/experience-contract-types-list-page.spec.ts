import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminAccessService } from '@/app/core/auth/admin-access.service';
import { ExperienceContractTypeService } from '@/app/features/experience-contract-types/experience-contract-type.service';
import { ExperienceContractTypesListPage } from '@/app/features/experience-contract-types/experience-contract-types-list-page';
import { ExperienceContractTypeAdminListItem } from '@/app/shared/models/experience-contract-type.model';
import { provideAdminIcons } from '@/app/shared/icons/admin-icons';

type ContractTypesListPageHarness = ExperienceContractTypesListPage & {
  deleteForm: ExperienceContractTypesListPage['deleteForm'];
  deactivateForm: ExperienceContractTypesListPage['deactivateForm'];
  acceptDelete(): void;
  acceptDeactivate(): void;
  confirmDelete(item: ExperienceContractTypeAdminListItem): void;
  confirmDeactivate(item: ExperienceContractTypeAdminListItem): void;
  deleteTarget(): ExperienceContractTypeAdminListItem | null;
  deactivateTarget(): ExperienceContractTypeAdminListItem | null;
};

const ITEM: ExperienceContractTypeAdminListItem = {
  id: 'ct-id',
  slug: 'alternance',
  codeFr: 'alternance-fr',
  codeEn: 'work-study-en',
  titleFr: 'Alternance',
  titleEn: 'Work-study',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deactivatedAt: null,
};

const EMPTY_PAGE = {
  data: [] as ExperienceContractTypeAdminListItem[],
  pagination: {
    page: 0,
    size: 50,
    totalItems: 0,
    totalPages: 0,
  },
};

describe('ExperienceContractTypesListPage honeypot', () => {
  const getContractTypes = vi.fn();
  const deleteContractType = vi.fn();
  const deactivateContractType = vi.fn();
  const reactivateContractType = vi.fn();

  beforeEach(async () => {
    getContractTypes.mockReset();
    deleteContractType.mockReset();
    deactivateContractType.mockReset();
    reactivateContractType.mockReset();
    getContractTypes.mockReturnValue(of(EMPTY_PAGE));

    await TestBed.configureTestingModule({
      imports: [ExperienceContractTypesListPage],
      providers: [
        provideAdminIcons(),
        provideRouter([]),
        {
          provide: ExperienceContractTypeService,
          useValue: {
            getContractTypes,
            deleteContractType,
            deactivateContractType,
            reactivateContractType,
          },
        },
        {
          provide: AdminAccessService,
          useValue: { isAdmin: () => true },
        },
      ],
    }).compileComponents();
  });

  function createHarness(): ContractTypesListPageHarness {
    const fixture = TestBed.createComponent(ExperienceContractTypesListPage);
    fixture.detectChanges();
    return fixture.componentInstance as ContractTypesListPageHarness;
  }

  it('does not deactivate when the honeypot is filled', () => {
    const component = createHarness();
    component.confirmDeactivate(ITEM);
    component.deactivateForm.setValue({ website: 'spam' });

    component.acceptDeactivate();

    expect(deactivateContractType).not.toHaveBeenCalled();
    expect(component.deactivateTarget()).toBeNull();
  });

  it('deactivates when the honeypot stays empty', () => {
    deactivateContractType.mockReturnValue(of(void 0));
    const component = createHarness();
    component.confirmDeactivate(ITEM);
    component.deactivateForm.setValue({ website: '' });

    component.acceptDeactivate();

    expect(deactivateContractType).toHaveBeenCalledWith('ct-id', { website: '' });
  });

  it('does not delete when the honeypot is filled', () => {
    const component = createHarness();
    component.confirmDelete({ ...ITEM, deactivatedAt: '2026-01-02T00:00:00.000Z' });
    component.deleteForm.setValue({ website: 'spam' });

    component.acceptDelete();

    expect(deleteContractType).not.toHaveBeenCalled();
    expect(component.deleteTarget()).toBeNull();
  });

  it('deletes when the honeypot stays empty', () => {
    deleteContractType.mockReturnValue(of(void 0));
    const component = createHarness();
    const deactivated = { ...ITEM, deactivatedAt: '2026-01-02T00:00:00.000Z' };
    component.confirmDelete(deactivated);
    component.deleteForm.setValue({ website: '' });

    component.acceptDelete();

    expect(deleteContractType).toHaveBeenCalledWith('ct-id', { website: '' });
  });
});
