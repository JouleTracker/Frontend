import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, throwError } from 'rxjs';
import { SubscriptionPlan, User } from '../domain/model/user.entity';
import { SignInCommand } from '../domain/model/sign-in.command';
import { SignUpCommand } from '../domain/model/sign-up.command';
import { IamApi } from '../infrastructure/iam-api';
import { SignInAssembler } from '../infrastructure/sign-in-assembler';
import { SignUpAssembler } from '../infrastructure/sign-up-assembler';
import { saveLocalUserPreferences } from '../infrastructure/user-mapper.util';

/**
 * Signal-based application store managing IAM authentication state, JWT session
 * persistence, role-based access helpers, subscription limits, and account lifecycle actions.
 */
@Injectable({ providedIn: 'root' })
export class IamStore {
  private readonly iamApi = inject(IamApi);
  private readonly router = inject(Router);

  private readonly storageKey = 'jouletracker_session';

  private readonly _currentUser = signal<User | null>(this.restoreSession());
  readonly currentUser = this._currentUser.asReadonly();

  // Authentication state
  readonly isSignedIn = computed(() => this._currentUser() !== null);
  readonly isAuthenticated = this.isSignedIn;

  /** Normalized role and moderation status checks */
  readonly isAdmin = computed(
    () => this._currentUser()?.role?.toString().toLowerCase().trim() === 'admin'
  );
  readonly isBusiness = computed(
    () => this._currentUser()?.role?.toString().toLowerCase().trim() === 'business'
  );
  readonly isHomeowner = computed(() => !this.isAdmin() && !this.isBusiness());
  readonly isBanned = computed(() => {
    const user = this._currentUser();
    if (!user) return false;
    return (
      Boolean(user.banned) ||
      user.status === 'BANNED' ||
      user.status === 'SUSPENDED' ||
      user.status === 'INACTIVE'
    );
  });

  /** Normalized current role (`'admin' | 'business' | 'homeowner'`) */
  readonly currentRole = computed(() => {
    const role = this._currentUser()?.role?.toString().toLowerCase().trim();
    if (role === 'admin') return 'admin';
    if (role === 'business') return 'business';
    return 'homeowner';
  });

  /** Identifier of the currently authenticated user */
  readonly currentUserId = computed(() => this._currentUser()?.id ?? null);

  // Subscription plans and feature entitlements
  readonly currentPlan = computed<SubscriptionPlan>(() => this._currentUser()?.plan ?? 'pro');

  readonly hasPlusAccess = computed(() => ['plus', 'pro'].includes(this.currentPlan()));
  readonly hasProAccess = computed(() => this.currentPlan() === 'pro');

  readonly deviceLimit = computed(() => {
    const plan = this.currentPlan();
    if (plan === 'starter') return 5;
    if (plan === 'plus') return 15;
    return Infinity;
  });

  readonly sensorLimit = computed(() => {
    const plan = this.currentPlan();
    if (plan === 'starter') return 0;
    if (plan === 'plus') return 3;
    return Infinity;
  });

  readonly canAccessSensors = computed(() => this.sensorLimit() > 0);

  readonly historyDaysLimit = computed(() => {
    const plan = this.currentPlan();
    if (plan === 'starter') return 7;
    if (plan === 'plus') return 30;
    return Infinity;
  });

  constructor() {
    this.refreshSessionFromBackend();
  }

  /**
   * Synchronizes the locally restored session with the latest user profile and status
   * from the backend API. Clears the session if the token is rejected or account is restricted.
   */
  private refreshSessionFromBackend(): void {
    const session = this._currentUser();
    if (session?.id) {
      this.iamApi.getUserById(session.id).subscribe({
        next: (freshUser) => {
          if (freshUser) {
            const merged: User = {
              ...session,
              id: freshUser.id ?? session.id,
              name: freshUser.name || session.name,
              firstName: freshUser.firstName ?? session.firstName,
              lastName: freshUser.lastName ?? session.lastName,
              email: freshUser.email || session.email,
              role: freshUser.role || session.role,
              verified: freshUser.verified ?? session.verified,
              status: freshUser.status ?? session.status,
              banned: freshUser.banned ?? session.banned,
              plan: freshUser.plan ?? session.plan ?? 'pro',
              phone: freshUser.phone !== undefined ? freshUser.phone : session.phone,
              home: freshUser.home ?? session.home,
              business: freshUser.business ?? session.business,
              notifications: freshUser.notifications ?? session.notifications,
              token: session.token
            };

            if (
              merged.banned ||
              merged.status === 'BANNED' ||
              merged.status === 'SUSPENDED' ||
              merged.status === 'INACTIVE'
            ) {
              this.clearSessionOnly();
              return;
            }

            this._currentUser.set(merged);
            this.persistSession(merged);
          }
        },
        error: (err) => {
          if (err?.status === 401 || err?.status === 403 || err?.status === 404) {
            this.clearSessionOnly();
          }
        }
      });
    }
  }

  /**
   * Authenticates the user, stores the JWT session, and navigates to the role dashboard.
   */
  signIn(command: SignInCommand): Observable<unknown> {
    const request = SignInAssembler.toRequestFromCommand(command);
    return this.iamApi.signIn(request).pipe(
      tap((response) => {
        const user = SignInAssembler.toEntityFromResponse(response);

        if (
          user.banned ||
          user.status === 'BANNED' ||
          user.status === 'SUSPENDED' ||
          user.status === 'INACTIVE'
        ) {
          throw new Error(
            'Tu cuenta se encuentra suspendida, baneada o inactiva. Contacta con soporte.'
          );
        }

        this._currentUser.set(user);
        this.persistSession(user);

        const targetRoute = user.role === 'admin' ? '/admin' : '/inicio';
        this.router.navigate([targetRoute]).catch((err) => {
          console.error('Navigation failed after sign-in:', err);
        });
      })
    );
  }

  /**
   * Registers a new JouleTracker account and stores initial local preferences.
   */
  signUp(command: SignUpCommand): Observable<unknown> {
    saveLocalUserPreferences(command.email, {
      role: command.role || 'homeowner',
      plan: command.plan || 'pro'
    });
    const request = SignUpAssembler.toRequestFromCommand(command);
    return this.iamApi.signUp(request);
  }

  /**
   * Deactivates the currently authenticated user's account via `PATCH /api/v1/users/{id}/deactivate`,
   * immediately clears local authentication state and tokens, and redirects to sign-in.
   */
  deactivateCurrentAccount(): Observable<void> {
    const userId = this._currentUser()?.id;
    if (!userId) {
      return throwError(() => new Error('No se encontró una sesión de usuario activa.'));
    }

    return this.iamApi.deactivateAccount(userId).pipe(
      tap(() => {
        this.clearSessionOnly();
        this.router.navigate(['/login'], { queryParams: { deactivated: '1' } });
      })
    );
  }

  /**
   * Clears the active session and redirects to the sign-in screen.
   */
  signOut(): void {
    this.clearSessionOnly();
    this.router.navigate(['/login']);
  }

  private clearSessionOnly(): void {
    this._currentUser.set(null);
    localStorage.removeItem(this.storageKey);
  }

  updatePlan(newPlan: SubscriptionPlan): void {
    const current = this._currentUser();
    if (!current) return;

    const updatedUser: User = { ...current, plan: newPlan };
    this._currentUser.set(updatedUser);
    this.persistSession(updatedUser);

    if (current.id) {
      this.iamApi.updateUserPlan(current.id, newPlan, current.email).subscribe({
        error: (err) => {
          console.error('Failed to update plan:', err);
        }
      });
    }
  }

  /**
   * Persists personal profile edits (`firstName`, `lastName`, `phone`) via `PUT /api/v1/users/{id}` (US-22)
   * and updates the reactive session state.
   */
  updatePersonalProfile(payload: {
    firstName: string;
    lastName: string;
    phone?: string | null;
  }): Observable<User> {
    const current = this._currentUser();
    if (!current?.id) {
      return throwError(() => new Error('No active user session found.'));
    }

    return this.iamApi.updatePersonalProfile(current.id, payload).pipe(
      tap((updated) => {
        const merged: User = {
          ...current,
          name: updated.name,
          firstName: updated.firstName,
          lastName: updated.lastName,
          phone: updated.phone,
          status: updated.status ?? current.status,
          verified: updated.verified ?? current.verified
        };
        saveLocalUserPreferences(merged.email, { phone: merged.phone });
        this._currentUser.set(merged);
        this.persistSession(merged);
      })
    );
  }

  updateProfile(changes: Partial<User>): void {
    const current = this._currentUser();
    if (!current) return;

    const updatedUser: User = { ...current, ...changes };
    this._currentUser.set(updatedUser);
    this.persistSession(updatedUser);

    if (current.id) {
      this.iamApi.updateUserProfile(current.id, { email: current.email, ...changes }).subscribe({
        error: (err) => {
          console.error('Failed to update profile:', err);
        }
      });
    }
  }

  private persistSession(user: User): void {
    localStorage.setItem(this.storageKey, JSON.stringify(user));
  }

  private restoreSession(): User | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as User;
      if (!parsed?.token || !this.isValidJwtToken(parsed.token)) {
        localStorage.removeItem(this.storageKey);
        return null;
      }
      return parsed;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  private isValidJwtToken(token: string): boolean {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    try {
      const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadJson) as { exp?: number };
      if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }
}
