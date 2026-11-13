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

  it('should handle single-word name when splitting into firstName and lastName', () => {
    const req = SignUpAssembler.toRequestFromCommand({
      name: 'Admin',
      email: 'admin@jouletracker.com',
      password: 'Password123!',
      role: 'admin'
    });

    expect(req.firstName).toBe('Admin');
    expect(req.lastName).toBe('Admin');
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
});
