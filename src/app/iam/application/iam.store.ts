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

@Injectable({ providedIn: 'root' })
export class IamStore {
  private readonly iamApi = inject(IamApi);
  private readonly router = inject(Router);

  private readonly storageKey = 'jouletracker_session';

  private readonly _currentUser = signal<User | null>(this.restoreSession());
  readonly currentUser = this._currentUser.asReadonly();

  // Estado de sesión
  readonly isSignedIn = computed(() => this._currentUser() !== null);
  readonly isAuthenticated = this.isSignedIn;

  /** Roles y permisos especiales (normalizados en minúsculas y sin espacios) */
  readonly isAdmin = computed(() => this._currentUser()?.role?.toString().toLowerCase().trim() === 'admin');
  readonly isBusiness = computed(() => this._currentUser()?.role?.toString().toLowerCase().trim() === 'business');
  readonly isHomeowner = computed(() => !this.isAdmin() && !this.isBusiness());
  readonly isBanned = computed(() => !!this._currentUser()?.banned);

  /** Rol actual normalizado ('admin' | 'business' | 'homeowner') */
  readonly currentRole = computed(() => {
    const role = this._currentUser()?.role?.toString().toLowerCase().trim();
    if (role === 'admin') return 'admin';
    if (role === 'business') return 'business';
    return 'homeowner';
  });

  /** ID del usuario autenticado */
  readonly currentUserId = computed(() => this._currentUser()?.id ?? null);

  // ── Gestión de Planes y Permisos (Por defecto todos cuentan con plan Pro) ──
  readonly currentPlan = computed<SubscriptionPlan>(
    () => this._currentUser()?.plan ?? 'pro'
  );

  readonly hasPlusAccess = computed(() =>
    ['plus', 'pro'].includes(this.currentPlan())
  );
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
   * Sincroniza la sesión almacenada localmente con los datos más recientes del backend
   * (actualiza de inmediato rol, datos comerciales o cambios de plan).
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
              email: freshUser.email || session.email,
              role: freshUser.role || session.role,
              verified: freshUser.verified ?? session.verified,
              banned: freshUser.banned ?? session.banned,
              plan: freshUser.plan ?? session.plan ?? 'pro',
              phone: freshUser.phone ?? session.phone,
              home: freshUser.home ?? session.home,
              business: freshUser.business ?? session.business,
              notifications: freshUser.notifications ?? session.notifications,
              token: session.token
            };
            this._currentUser.set(merged);
            this.persistSession(merged);
          }
        },
        error: (err) => {
          // Si el token ya no es válido o el usuario no existe en el backend actual, limpiar la sesión
          if (err?.status === 401 || err?.status === 403 || err?.status === 404) {
            this.clearSessionOnly();
          }
        }
      });
    }
  }

  // ── Métodos de Autenticación ──────────────────────────────────
  signIn(command: SignInCommand): Observable<any> {
    const request = SignInAssembler.toRequestFromCommand(command);
    return this.iamApi.signIn(request).pipe(
      tap((response) => {
        const user = SignInAssembler.toEntityFromResponse(response);

        // Bloqueo de acceso si el usuario está baneado
        if (user.banned) {
          throw new Error('Tu cuenta se encuentra suspendida temporalmente por un administrador.');
        }

        this._currentUser.set(user);
        this.persistSession(user);

        // Redirección condicionada por rol
        const targetRoute = user.role === 'admin' ? '/admin' : '/inicio';
        this.router.navigate([targetRoute]).catch((err) => {
          console.error('Error al navegar:', err);
        });
      })
    );
  }

  signUp(command: SignUpCommand): Observable<any> {
    saveLocalUserPreferences(command.email, {
      role: command.role || 'homeowner',
      plan: command.plan || 'pro'
    });
    const request = SignUpAssembler.toRequestFromCommand(command);
    return this.iamApi.signUp(request).pipe(
      tap((response) => {
        console.log('Usuario registrado con éxito en IamStore:', response);
      })
    );
  }

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
        next: (savedUser) => {
          console.log('Plan actualizado:', savedUser.plan);
        },
        error: (err) => {
          console.error('Error al actualizar plan:', err);
        }
      });
    }
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
          console.error('Error al actualizar perfil:', err);
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
