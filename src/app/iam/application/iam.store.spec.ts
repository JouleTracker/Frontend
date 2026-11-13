import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { IamStore } from './iam.store';

describe('IamStore session bootstrap', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should discard legacy json-server non-JWT session tokens on startup', () => {
    localStorage.setItem(
      'jouletracker_session',
      JSON.stringify({ id: 1, name: 'Juan', email: 'juan@gmail.com', token: 'token-1', role: 'homeowner' })
    );

    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });

    const store = TestBed.inject(IamStore);
    expect(store.isSignedIn()).toBe(false);
    expect(localStorage.getItem('jouletracker_session')).toBeNull();
  });
});
