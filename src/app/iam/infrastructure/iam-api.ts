// src/app/iam/infrastructure/iam-api.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, throwError } from 'rxjs';
import { SignInRequest } from './sign-in.request';
import { SignInResponse } from './sign-in-response';
import { SignUpRequest } from './sign-up.request';
import { SignUpResponse } from './sign-up-response';
import { SignInApiEndpoint } from './sign-in-api-endpoint';
import { SignUpApiEndpoint } from './sign-up-api-endpoint';

@Injectable({ providedIn: 'root' })
export class IamApi {
  private readonly http = inject(HttpClient);

  signIn(request: SignInRequest): Observable<SignInResponse> {
    const url = `${SignInApiEndpoint.getEndpoint()}?email=${encodeURIComponent(
      request.email
    )}&password=${encodeURIComponent(request.password)}`;

    return this.http.get<any[]>(url).pipe(
      map((users) => {
        if (!users || users.length === 0) {
          throw new Error('Credenciales incorrectas');
        }
        const user = users[0];
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: `token-${user.id}`
        };
      })
    );
  }

  signUp(request: SignUpRequest): Observable<SignUpResponse> {
    const newUser = {
      ...request,
      verified: true,
      verificationCode: null
    };
    return this.http.post<SignUpResponse>(SignUpApiEndpoint.getEndpoint(), newUser);
  }
}
