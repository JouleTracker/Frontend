import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { SignInRequest } from './sign-in.request';
import { SignInResponse } from './sign-in-response';
import { SignUpRequest } from './sign-up.request';
import { SignUpResponse } from './sign-up-response';
import { SignInApiEndpoint } from './sign-in-api-endpoint';
import { SignUpApiEndpoint } from './sign-up-api-endpoint';
import { SubscriptionPlan, User } from '../domain/model/user.entity';
import { environment } from '../../../environments/environment';
import { extractHttpErrorMessage } from '../../shared/infrastructure/http-error.util';
import {
  BackendUserResource,
  mapBackendUserToEntity,
  saveLocalUserPreferences
} from './user-mapper.util';

@Injectable({ providedIn: 'root' })
export class IamApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  signIn(request: SignInRequest): Observable<SignInResponse> {
    const payload: SignInRequest = {
      email: request.email.trim().toLowerCase(),
      password: request.password
    };

    return this.http.post<SignInResponse>(SignInApiEndpoint.getEndpoint(), payload).pipe(
      catchError((err) =>
        throwError(() => new Error(extractHttpErrorMessage(err, 'Credenciales incorrectas.')))
      )
    );
  }

  signUp(request: SignUpRequest): Observable<SignUpResponse> {
    return this.http.post<SignUpResponse>(SignUpApiEndpoint.getEndpoint(), request).pipe(
      catchError((err) =>
        throwError(() => new Error(extractHttpErrorMessage(err, 'No se pudo completar el registro.')))
      )
    );
  }

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

  getUsers(): Observable<User[]> {
    return this.http
      .get<BackendUserResource[]>(`${this.baseUrl}${environment.usersEndpointPath}`)
      .pipe(map((users) => (users ?? []).map((u) => mapBackendUserToEntity(u))));
  }

  getUserById(userId: number): Observable<User> {
    return this.http
      .get<BackendUserResource>(`${this.baseUrl}${environment.usersEndpointPath}/${userId}`)
      .pipe(map((res) => mapBackendUserToEntity(res)));
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
