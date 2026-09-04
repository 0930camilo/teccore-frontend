import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const institucionId = authService.getInstitucionId();

  const apiUrls = Object.values(environment).filter((v): v is string => typeof v === 'string');
  const isApiRequest = apiUrls.some(url => request.url.startsWith(url));

  if (!isApiRequest || !token) {
    return next(request);
  }

  let headers = request.headers.set('Authorization', `Bearer ${token}`);

  if (institucionId !== null) {
    headers = headers.set('X-Institucion-Id', String(institucionId));
  }

  return next(request.clone({ headers }));
};

