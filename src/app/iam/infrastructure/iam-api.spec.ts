import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { IamApi } from './iam-api';
import { SignInAssembler } from './sign-in-assembler';
import { SignUpAssembler } from './sign-up-assembler';
import { environment } from '../../../environments/environment';

describe('IamApi & Assemblers (Spring Boot Integration)', () => {
  let api: IamApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    api = TestBed.inject(IamApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should split full name into firstName and lastName for sign-up', () => {
    const req = SignUpAssembler.toRequestFromCommand({
      name: 'Juan Carlos Perez',
      email: 'Juan@Example.com ',
      password: 'Password123!',
      role: 'homeowner',
      plan: 'pro'
    });

    expect(req).toEqual({
      email: 'juan@example.com',
      password: 'Password123!',
      firstName: 'Juan',
      lastName: 'Carlos Perez'
    });
  });

  it('should not duplicate single-word name into lastName when splitting full name', () => {
    const req = SignUpAssembler.toRequestFromCommand({
      name: 'rodrigo',
      email: 'rodrigo@jouletracker.com',
      password: 'Password123!',
      role: 'homeowner'
    });

    expect(req.firstName).toBe('rodrigo');
    expect(req.lastName).toBe('');
  });

  it('should POST sign-in and map AuthenticatedUserResource into User entity', () => {
    let resolvedName = '';
    let resolvedRole = '';
    let resolvedToken = '';

    api.signIn({ email: 'ana@jouletracker.com', password: 'Password123!' }).subscribe((res) => {
      const user = SignInAssembler.toEntityFromResponse(res);
      resolvedName = user.name;
      resolvedRole = String(user.role);
      resolvedToken = user.token ?? '';
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}${environment.loginEndpointPath}`);
    expect(req.request.method).toBe('POST');
    req.flush({
      token: 'jwt-token-abc',
      tokenType: 'Bearer',
      user: {
        id: 10,
        email: 'ana@jouletracker.com',
        firstName: 'Ana',
        lastName: 'Lopez',
        roles: ['ROLE_ADMIN'],
        emailVerified: true
      }
    });

    expect(resolvedName).toBe('Ana Lopez');
    expect(resolvedRole).toBe('admin');
    expect(resolvedToken).toBe('jwt-token-abc');
  });

  it('should GET verify-email with query token parameter', () => {
    let verifiedFlag = false;
    api.verifyEmail('verify-123').subscribe((user) => {
      verifiedFlag = !!user.verified;
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}${environment.verifyEmailEndpointPath}?token=verify-123`
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      id: 7,
      email: 'new@jouletracker.com',
      firstName: 'New',
      lastName: 'User',
      roles: ['ROLE_USER'],
      emailVerified: true
    });

    expect(verifiedFlag).toBe(true);
  });

  it('should POST forgot-password with normalized email (US-03)', () => {
    let completed = false;
    api.forgotPassword(' User@Example.com ').subscribe(() => {
      completed = true;
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}${environment.forgotPasswordEndpointPath}`
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'user@example.com' });
    req.flush({ message: 'If the email exists, instructions have been sent.' });
    expect(completed).toBe(true);
  });

  it('should POST reset-password with token and newPassword (US-03)', () => {
    let completed = false;
    api.resetPassword(' reset-token-123 ', 'StrongPass1!').subscribe(() => {
      completed = true;
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}${environment.resetPasswordEndpointPath}`
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      token: 'reset-token-123',
      newPassword: 'StrongPass1!'
    });
    req.flush({});
    expect(completed).toBe(true);
  });

  it('should POST resend-verification with normalized email (US-04)', () => {
    let completed = false;
    api.resendVerification(' Test@Example.com ').subscribe(() => {
      completed = true;
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}${environment.resendCodeEndpointPath}`
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@example.com' });
    req.flush({});
    expect(completed).toBe(true);
  });

  it('should PUT changePassword to /users/{id}/password (US-25)', () => {
    let completed = false;
    api.changePassword(42, 'OldPass1!', 'NewPass2@').subscribe(() => {
      completed = true;
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}${environment.usersEndpointPath}/42/password`
    );
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      currentPassword: 'OldPass1!',
      newPassword: 'NewPass2@'
    });
    req.flush(null);
    expect(completed).toBe(true);
  });

  it('should PATCH deactivateAccount to /users/{id}/deactivate (US-40)', () => {
    let completed = false;
    api.deactivateAccount(42).subscribe(() => {
      completed = true;
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}${environment.usersEndpointPath}/42/deactivate`
    );
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
    expect(completed).toBe(true);
  });

  it('should PATCH updateUserStatus to /users/{id}/status and map status (US-49)', () => {
    let updatedStatus: string | undefined;
    let updatedBanned: boolean | undefined;

    api.updateUserStatus(15, 'SUSPENDED').subscribe((user) => {
      updatedStatus = user.status;
      updatedBanned = user.banned;
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}${environment.usersEndpointPath}/15/status`
    );
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'SUSPENDED' });
    req.flush({
      id: 15,
      email: 'client@jouletracker.com',
      firstName: 'Client',
      lastName: 'User',
      roles: ['ROLE_USER'],
      status: 'SUSPENDED'
    });

    expect(updatedStatus).toBe('SUSPENDED');
    expect(updatedBanned).toBe(true);
  });
});
