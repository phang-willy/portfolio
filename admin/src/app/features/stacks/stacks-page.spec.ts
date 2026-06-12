import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminAccessService } from '@/app/core/auth/admin-access.service';
import { StackService } from '@/app/features/stacks/stack.service';
import { StacksPage } from '@/app/features/stacks/stacks-page';
import { Stack } from '@/app/shared/models/stack.model';
import { provideAdminIcons } from '@/app/shared/icons/admin-icons';

type StacksPageHarness = StacksPage & {
  stackForm: StacksPage['stackForm'];
  deleteForm: StacksPage['deleteForm'];
  submitStack(): void;
  acceptDelete(): void;
  confirmDelete(stack: Stack): void;
  editingStack(): Stack | null;
  deleteTarget(): Stack | null;
};

const STACK: Stack = {
  id: 'stack-id',
  name: 'Angular',
  image: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const EMPTY_PAGE = {
  data: [] as Stack[],
  pagination: {
    page: 0,
    size: 50,
    totalItems: 0,
    totalPages: 0,
  },
};

describe('StacksPage honeypot', () => {
  const getStacks = vi.fn();
  const createStack = vi.fn();
  const updateStack = vi.fn();
  const deleteStack = vi.fn();

  beforeEach(async () => {
    getStacks.mockReset();
    createStack.mockReset();
    updateStack.mockReset();
    deleteStack.mockReset();
    getStacks.mockReturnValue(of(EMPTY_PAGE));

    await TestBed.configureTestingModule({
      imports: [StacksPage],
      providers: [
        provideAdminIcons(),
        {
          provide: StackService,
          useValue: { getStacks, createStack, updateStack, deleteStack },
        },
        {
          provide: AdminAccessService,
          useValue: { isAdmin: () => true },
        },
      ],
    }).compileComponents();
  });

  function createHarness(): StacksPageHarness {
    const fixture = TestBed.createComponent(StacksPage);
    fixture.detectChanges();
    return fixture.componentInstance as StacksPageHarness;
  }

  it('does not create a stack when the honeypot is filled', () => {
    const component = createHarness();

    component.stackForm.setValue({
      name: 'Angular',
      image: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      website: 'https://spam.example',
    });

    component.submitStack();

    expect(createStack).not.toHaveBeenCalled();
    expect(updateStack).not.toHaveBeenCalled();
  });

  it('creates a stack when the honeypot stays empty', () => {
    createStack.mockReturnValue(of(STACK));
    const component = createHarness();

    component.stackForm.setValue({
      name: 'Angular',
      image: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      website: '',
    });

    component.submitStack();

    expect(createStack).toHaveBeenCalledWith({
      name: 'Angular',
      image: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      website: '',
    });
  });

  it('does not update a stack when the honeypot is filled', () => {
    const component = createHarness();
    component.editingStack.set(STACK);
    component.stackForm.setValue({
      name: 'Angular',
      image: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      website: 'bot',
    });

    component.submitStack();

    expect(updateStack).not.toHaveBeenCalled();
  });

  it('updates a stack when the honeypot stays empty', () => {
    updateStack.mockReturnValue(of(STACK));
    const component = createHarness();
    component.editingStack.set(STACK);
    component.stackForm.setValue({
      name: 'Angular',
      image: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      website: '',
    });

    component.submitStack();

    expect(updateStack).toHaveBeenCalledWith('stack-id', {
      name: 'Angular',
      image: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      website: '',
    });
  });

  it('does not delete a stack when the honeypot is filled', () => {
    const component = createHarness();
    component.confirmDelete(STACK);
    component.deleteForm.setValue({ website: 'spam' });

    component.acceptDelete();

    expect(deleteStack).not.toHaveBeenCalled();
    expect(component.deleteTarget()).toBeNull();
  });

  it('deletes a stack when the honeypot stays empty', () => {
    deleteStack.mockReturnValue(of(void 0));
    const component = createHarness();
    component.confirmDelete(STACK);
    component.deleteForm.setValue({ website: '' });

    component.acceptDelete();

    expect(deleteStack).toHaveBeenCalledWith('stack-id', { website: '' });
  });
});
