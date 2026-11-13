import { HttpInterceptorFn } from '@angular/common/http';

export const iamInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/api/v1/authentication/')) {
    return next(req);
  }

  const rawSession = localStorage.getItem('jouletracker_session');
  if (rawSession) {
    try {
      const session = JSON.parse(rawSession);
      if (session.token) {
        const cloned = req.clone({
          setHeaders: { Authorization: `Bearer ${session.token}` }
        });
        return next(cloned);
      }
    } catch {
      // Ignore malformed local storage session
    }
  }
  return next(req);
};
