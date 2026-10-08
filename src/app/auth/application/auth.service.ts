import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, LoginCredentials, RegisterPayload, AuthResponse } from '../domain/model/user.entity';

/**
 * Authentication service for JouleTracker.
 *
 * Manages user session state using Angular signals, persists the session
 * in localStorage, and communicates with the backend auth endpoints.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly storageKey = 'jouletracker_auth';
  private readonly pendingEmailKey = 'jouletracker_pending_email';

  /** Current authenticated user (null when logged out). */
  private readonly _currentUser = signal<User | null>(this.restoreUser());

  /** Read-only signal for the current user. */
  readonly currentUser = this._currentUser.asReadonly();

  /** Whether a user is currently authenticated. */
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  /**
   * Attempts to log in with the given credentials.
   * On success, stores the user and navigates to the home view.
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    const url = `${environment.apiBaseUrl}${environment.usersEndpointPath}?email=${encodeURIComponent(
      credentials.email
    )}&password=${encodeURIComponent(credentials.password)}`;

    return this.http.get<User[]>(url).pipe(
      map((users) => {
        if (!users || users.length === 0) {
          throw new Error('Credenciales incorrectas');
        }

        const user = users[0];

        if (!user.verified) {
          throw new Error('La cuenta aún no ha sido verificada');
        }

        const authResponse: AuthResponse = {
          token: 'fake-jwt-token-' + user.id,
          user: user
        };

        return authResponse;
      }),
      tap((response) => {
        this._currentUser.set(response.user);
        this.persistSession(response);
        this.router.navigate(['/inicio']);
      })
    );
  }

  /**
   * Registers a new user account.
   * On success, stores the pending email and navigates to email verification.
   */
  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}${environment.registerEndpointPath}`, payload)
      .pipe(
        tap((response) => {
          this.setPendingEmail(payload.email);
          this.router.navigate(['/verificar-correo']);
        })
      );
  }

  /**
   * Sends a password recovery email to the given address.
   */
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.apiBaseUrl}${environment.forgotPasswordEndpointPath}`,
      { email }
    );
  }

  /**
   * Verifies the email with the provided 6-digit code.
   */
  verifyEmail(code: string): Observable<AuthResponse> {
    const email = this.getPendingEmail();
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}${environment.verifyEmailEndpointPath}`, {
        email,
        code
      })
      .pipe(
        tap((response) => {
          this._currentUser.set(response.user);
          this.persistSession(response);
          this.clearPendingEmail();
          this.router.navigate(['/inicio']);
        })
      );
  }

  /**
   * Resends the verification code to the pending email.
   */
  resendCode(): Observable<{ message: string }> {
    const email = this.getPendingEmail();
    return this.http.post<{ message: string }>(
      `${environment.apiBaseUrl}${environment.resendCodeEndpointPath}`,
      { email }
    );
  }

  /**
   * Logs out the current user and navigates to the login page.
   */
  logout(): void {
    this._currentUser.set(null);
    localStorage.removeItem(this.storageKey);
    this.router.navigate(['/login']);
  }

  /**
   * Returns the pending email stored during registration.
   */
  getPendingEmail(): string {
    return localStorage.getItem(this.pendingEmailKey) ?? '';
  }

  /**
   * Stores the email that is pending verification.
   */
  setPendingEmail(email: string): void {
    localStorage.setItem(this.pendingEmailKey, email);
  }

  /**
   * Clears the pending email from storage.
   */
  clearPendingEmail(): void {
    localStorage.removeItem(this.pendingEmailKey);
  }

  // ── Private helpers ──────────────────────────────────────────────

  private persistSession(auth: AuthResponse): void {
    localStorage.setItem(this.storageKey, JSON.stringify(auth));
  }

  private restoreUser(): User | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AuthResponse;
      return parsed.user ?? null;
    } catch {
      return null;
    }
  }
}
