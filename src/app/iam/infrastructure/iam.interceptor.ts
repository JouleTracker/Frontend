import { HttpInterceptorFn } from '@angular/common/http';

export const iamInterceptor: HttpInterceptorFn = (req, next) => {
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
    }
  }
  return next(req);
};
