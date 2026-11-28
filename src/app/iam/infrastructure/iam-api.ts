import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { SignInRequest } from './sign-in.request';
import { SignInResponse } from './sign-in-response';
import { SignUpRequest } from './sign-up.request';
import { SignUpResponse } from './sign-up-response';
import { SignInApiEndpoint } from './sign-in-api-endpoint';
import { SignUpApiEndpoint } from './sign-up-api-endpoint';
import { SubscriptionPlan, User, UserStatus } from '../domain/model/user.entity';
import { environment } from '../../../environments/environment';
import { extractHttpErrorMessage } from '../../shared/infrastructure/http-error.util';
import {
  BackendUserResource,
  mapBackendUserToEntity,
  saveLocalUserPreferences
} from './user-mapper.util';

export interface MessageResponse {
  message?: string;
}

export interface SubscriptionResource {
  userId: number;
  plan: SubscriptionPlan;
  planCode: string;
  status: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  checkoutUrl: string;
  plan: SubscriptionPlan;
  amountCents: number;
  currency: string;
}

/**
 * Infrastructure HTTP adapter for the IAM & User Management bounded contexts.
 * Connects Angular application services to the JouleTracker Spring Boot REST API.
 */
@Injectable({ providedIn: 'root' })
export class IamApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /**
   * Authenticates a user with email and password (`POST /api/v1/authentication/sign-in`).
   */
  signIn(request: SignInRequest): Observable<SignInResponse> {
    const payload: SignInRequest = {
      email: request.email.trim().toLowerCase(),
      password: request.password
    };

    return this.http.post<SignInResponse>(SignInApiEndpoint.getEndpoint(), payload).pipe(
      catchError((err) =>
        throwError(
          () => new Error(extractHttpErrorMessage(err, 'Correo electrónico o contraseña incorrectos.'))
        )
      )
    );
  }

  /**
   * Registers a new user account (`POST /api/v1/authentication/sign-up`).
   */
  signUp(request: SignUpRequest): Observable<SignUpResponse> {
    return this.http.post<SignUpResponse>(SignUpApiEndpoint.getEndpoint(), request).pipe(
      catchError((err) =>
        throwError(
          () => new Error(extractHttpErrorMessage(err, 'No se pudo completar el registro.'))
        )
      )
    );
  }

  /**
   * Verifies a user's email address using the activation token (`GET /api/v1/authentication/verify-email`).
   */
  verifyEmail(token: string): Observable<User> {
    const url = `${this.baseUrl}${environment.verifyEmailEndpointPath}?token=${encodeURIComponent(token.trim())}`;
    return this.http.get<BackendUserResource>(url).pipe(
      map((res) => mapBackendUserToEntity(res)),
      catchError((err) =>
        throwError(
          () =>
            new Error(
              extractHttpErrorMessage(err, 'El enlace de verificación es inválido o ha expirado.')
            )
        )
      )
    );
  }

  /**
   * Requests a fresh account verification email (`POST /api/v1/authentication/resend-verification`).
   */
  resendVerification(email: string): Observable<MessageResponse> {
    const url = `${this.baseUrl}${environment.resendCodeEndpointPath}`;
    return this.http
      .post<MessageResponse | null>(url, { email: email.trim().toLowerCase() })
      .pipe(
        map((res) => res ?? {}),
        catchError((err) =>
          throwError(
            () =>
              new Error(
                extractHttpErrorMessage(
                  err,
                  'No se pudo reenviar el correo de verificación. Inténtalo más tarde.'
                )
              )
          )
        )
      );
  }

  /**
   * Initiates the password recovery flow (`POST /api/v1/authentication/forgot-password`).
   * The backend returns an anti-enumeration response regardless of whether the email exists.
   */
  forgotPassword(email: string): Observable<MessageResponse> {
    const url = `${this.baseUrl}${environment.forgotPasswordEndpointPath}`;
    return this.http
      .post<MessageResponse | null>(url, { email: email.trim().toLowerCase() })
      .pipe(
        map((res) => res ?? {}),
        catchError((err) =>
          throwError(
            () =>
              new Error(
                extractHttpErrorMessage(
                  err,
                  'No se pudo procesar tu solicitud de recuperación en este momento.'
                )
              )
          )
        )
      );
  }

  /**
   * Completes the password reset flow using a recovery token (`POST /api/v1/authentication/reset-password`).
   */
  resetPassword(token: string, newPassword: string): Observable<MessageResponse> {
    const url = `${this.baseUrl}${environment.resetPasswordEndpointPath}`;
    return this.http
      .post<MessageResponse | null>(url, { token: token.trim(), newPassword })
      .pipe(
        map((res) => res ?? {}),
        catchError((err) =>
          throwError(
            () =>
              new Error(
                extractHttpErrorMessage(
                  err,
                  'El enlace de restablecimiento es inválido o ha expirado. Solicita uno nuevo.'
                )
              )
          )
        )
      );
  }

  /**
   * Changes the authenticated user's password (`PUT /api/v1/users/{id}/password`).
   */
  changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Observable<void> {
    const url = `${this.baseUrl}${environment.usersEndpointPath}/${userId}/password`;
    return this.http.put<void>(url, { currentPassword, newPassword }).pipe(
      catchError((err) =>
        throwError(
          () =>
            new Error(
              extractHttpErrorMessage(
                err,
                'No se pudo actualizar la contraseña. Verifica tu contraseña actual.'
              )
            )
        )
      )
    );
  }

  /**
   * Self-deactivates the authenticated user's account (`PATCH /api/v1/users/{id}/deactivate`).
   */
  deactivateAccount(userId: number): Observable<void> {
    const url = `${this.baseUrl}${environment.usersEndpointPath}/${userId}/deactivate`;
    return this.http.patch<void>(url, {}).pipe(
      catchError((err) =>
        throwError(
          () =>
            new Error(
              extractHttpErrorMessage(
                err,
                'No se pudo desactivar tu cuenta. Inténtalo nuevamente.'
              )
            )
        )
      )
    );
  }

  /**
   * Updates a user's moderation status as an administrator (`PATCH /api/v1/users/{id}/status`).
   */
  updateUserStatus(userId: number, status: UserStatus): Observable<User> {
    const url = `${this.baseUrl}${environment.usersEndpointPath}/${userId}/status`;
    return this.http.patch<BackendUserResource | null>(url, { status }).pipe(
      map((res) =>
        res
          ? mapBackendUserToEntity(res)
          : {
              id: userId,
              name: '',
              email: '',
              status,
              banned: status === 'BANNED' || status === 'SUSPENDED'
            }
      ),
      catchError((err) =>
        throwError(
          () =>
            new Error(
              extractHttpErrorMessage(err, 'No se pudo actualizar el estado del usuario.')
            )
        )
      )
    );
  }

  /**
   * Retrieves all users for administrative moderation (`GET /api/v1/users`).
   */
  getUsers(): Observable<User[]> {
    return this.http
      .get<BackendUserResource[]>(`${this.baseUrl}${environment.usersEndpointPath}`)
      .pipe(
        map((users) => (users ?? []).map((u) => mapBackendUserToEntity(u))),
        catchError((err) =>
          throwError(
            () => new Error(extractHttpErrorMessage(err, 'No se pudieron cargar los usuarios.'))
          )
        )
      );
  }

  /**
   * Retrieves a single user by identifier (`GET /api/v1/users/{id}`).
   */
  getUserById(userId: number): Observable<User> {
    return this.http
      .get<BackendUserResource>(`${this.baseUrl}${environment.usersEndpointPath}/${userId}`)
      .pipe(map((res) => mapBackendUserToEntity(res)));
  }

  /**
   * Updates the authenticated user's personal profile (`PUT /api/v1/users/{id}`, TS-12 / US-22).
   */
  updatePersonalProfile(
    userId: number,
    payload: { firstName: string; lastName: string; phone?: string | null }
  ): Observable<User> {
    const url = `${this.baseUrl}${environment.usersEndpointPath}/${userId}`;
    const trimmedPhone = payload.phone?.trim() ?? '';
    const body = {
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      phone: trimmedPhone.length > 0 ? trimmedPhone : null
    };

    return this.http.put<BackendUserResource>(url, body).pipe(
      map((res) => mapBackendUserToEntity(res)),
      catchError((err) =>
        throwError(
          () =>
            new Error(
              extractHttpErrorMessage(err, 'Unable to update your profile information.')
            )
        )
      )
    );
  }

  /**
   * Retrieves the authenticated user's persisted subscription plan (`GET /api/v1/subscriptions/me`).
   */
  getCurrentSubscription(): Observable<SubscriptionResource> {
    const url = `${this.baseUrl}${environment.subscriptionsEndpointPath}/me`;
    return this.http.get<SubscriptionResource>(url).pipe(
      catchError((err) =>
        throwError(
          () =>
            new Error(
              extractHttpErrorMessage(err, 'Unable to load your active subscription plan.')
            )
        )
      )
    );
  }

  /**
   * Creates a hosted Stripe Checkout Session for a subscription plan (`POST /api/v1/subscriptions/checkout-session`).
   */
  createCheckoutSession(plan: SubscriptionPlan): Observable<CheckoutSessionResponse> {
    const url = `${this.baseUrl}${environment.subscriptionsEndpointPath}/checkout-session`;
    return this.http
      .post<CheckoutSessionResponse>(url, { plan: plan.toUpperCase() })
      .pipe(
        catchError((err) =>
          throwError(
            () =>
              new Error(
                extractHttpErrorMessage(err, 'Unable to start Stripe Checkout session.')
              )
          )
        )
      );
  }

  /**
   * Verifies and confirms a completed Stripe Checkout Session (`POST /api/v1/subscriptions/confirm`).
   */
  confirmCheckoutSession(sessionId: string): Observable<SubscriptionResource> {
    const url = `${this.baseUrl}${environment.subscriptionsEndpointPath}/confirm`;
    return this.http
      .post<SubscriptionResource>(url, { sessionId: sessionId.trim() })
      .pipe(
        catchError((err) =>
          throwError(
            () =>
              new Error(
                extractHttpErrorMessage(err, 'Unable to confirm subscription payment.')
              )
          )
        )
      );
  }

  updateUserPlan(userId: number, plan: SubscriptionPlan, email?: string): Observable<Partial<User>> {
    saveLocalUserPreferences(email, { plan });
    return of({ id: userId, plan });
  }

  updateUserProfile(
    userId: number,
    changes: Partial<User> & { password?: string }
  ): Observable<Partial<User>> {
    const { password: _password, ...safeChanges } = changes;
    saveLocalUserPreferences(safeChanges.email, {
      phone: safeChanges.phone,
      home: safeChanges.home,
      business: safeChanges.business,
      notifications: safeChanges.notifications
    });
    return of({ id: userId, ...safeChanges });
  }
}
