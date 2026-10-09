import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { SubscriptionPlan, User } from '../domain/model/user.entity';
import { SignInCommand } from '../domain/model/sign-in.command';
import { SignUpCommand } from '../domain/model/sign-up.command';
import { IamApi } from '../infrastructure/iam-api';
import { SignInAssembler } from '../infrastructure/sign-in-assembler';
import { SignUpAssembler } from '../infrastructure/sign-up-assembler';

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

  /** ID del usuario autenticado (cada usuario trabaja únicamente con sus propios datos) */
  readonly currentUserId = computed(() => this._currentUser()?.id ?? null);

  // ── Gestión de Planes y Permisos ──────────────────────────────
  readonly currentPlan = computed<SubscriptionPlan>(
    () => this._currentUser()?.plan ?? 'starter'
  );

  // Permisos por nivel
  readonly hasPlusAccess = computed(() =>
    ['plus', 'pro'].includes(this.currentPlan())
  );
  readonly hasProAccess = computed(() => this.currentPlan() === 'pro');

  // Límites según suscripción
  readonly deviceLimit = computed(() => {
    const plan = this.currentPlan();
    if (plan === 'starter') return 5;
    if (plan === 'plus') return 15;
    return Infinity; // Pro sin límite
  });

  readonly sensorLimit = computed(() => {
    const plan = this.currentPlan();
    if (plan === 'starter') return 0;
    if (plan === 'plus') return 3;
    return Infinity;
  });

  /** Acceso al módulo de Sensores IoT (Starter lo tiene bloqueado) */
  readonly canAccessSensors = computed(() => this.sensorLimit() > 0);

  /** Historial y reportes: Starter 7 días, Plus 30 días, Pro completo */
  readonly historyDaysLimit = computed(() => {
    const plan = this.currentPlan();
    if (plan === 'starter') return 7;
    if (plan === 'plus') return 30;
    return Infinity;
  });

  // ── Métodos de Autenticación ──────────────────────────────────
  signIn(command: SignInCommand): Observable<any> {
    const request = SignInAssembler.toRequestFromCommand(command);
    return this.iamApi.signIn(request).pipe(
      tap((response) => {
        const user = SignInAssembler.toEntityFromResponse(response);
        this._currentUser.set(user);
        this.persistSession(user);

        this.router.navigate(['/inicio']).catch((err) => {
          console.error('Error al navegar:', err);
        });
      })
    );
  }

  signUp(command: SignUpCommand): Observable<any> {
    const request = SignUpAssembler.toRequestFromCommand(command);
    return this.iamApi.signUp(request).pipe(
      tap((response) => {
        console.log('Usuario registrado con éxito en IamStore:', response);
      })
    );
  }

  signOut(): void {
    this._currentUser.set(null);
    localStorage.removeItem(this.storageKey);
    this.router.navigate(['/login']);
  }

  // Actualiza el plan en memoria, en localStorage y en db.json
  updatePlan(newPlan: SubscriptionPlan): void {
    const current = this._currentUser();
    if (!current) return;

    // Actualización optimista inmediata
    const updatedUser: User = { ...current, plan: newPlan };
    this._currentUser.set(updatedUser);
    this.persistSession(updatedUser);

    // Persistencia en el backend (json-server)
    if (current.id) {
      this.iamApi.updateUserPlan(current.id, newPlan).subscribe({
        next: (savedUser) => {
          console.log('Plan persistido con éxito en backend:', savedUser.plan);
        },
        error: (err) => {
          console.error('Error al persistir plan en el servidor:', err);
        }
      });
    }
  }

  // Actualiza el perfil en memoria, en localStorage y en db.json
  updateProfile(changes: Partial<User>): void {
    const current = this._currentUser();
    if (!current) return;

    const updatedUser: User = { ...current, ...changes };
    this._currentUser.set(updatedUser);
    this.persistSession(updatedUser);

    if (current.id) {
      this.iamApi.updateUserProfile(current.id, changes).subscribe({
        error: (err) => {
          console.error('Error al persistir perfil en el servidor:', err);
        }
      });
    }
  }

  // ── Persistencia Local ────────────────────────────────────────
  private persistSession(user: User): void {
    localStorage.setItem(this.storageKey, JSON.stringify(user));
  }

  private restoreSession(): User | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
