import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { User } from '@/app/shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);

  readonly currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  setUser(user: User): void {
    this.currentUserSubject.next(user);
  }

  clearUser(): void {
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
