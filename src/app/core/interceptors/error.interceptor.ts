import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../../shared/services/notification.service';

function resolveMessage(error: HttpErrorResponse): string {
  const backendMessage =
    typeof error.error === 'string'
      ? error.error
      : error.error?.message ?? error.message;

  switch (error.status) {
    case 400:
      return backendMessage || 'Solicitud inválida.';
    case 403:
      return backendMessage || 'No tienes permisos para realizar esta acción.';
    case 404:
      return 'No se encontró el recurso solicitado.';
    case 500:
      return 'Ocurrió un error en el servidor. Intenta nuevamente.';
    default:
      return backendMessage || 'No fue posible completar la solicitud.';
  }
}

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const notificationService = inject(NotificationService);
  const platformId = inject(PLATFORM_ID);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          authService.logout();
          if (isPlatformBrowser(platformId)) {
            notificationService.error('Tu sesión expiró. Vuelve a iniciar sesión.');
          }
        } else {
          notificationService.error(resolveMessage(error));
        }
      } else {
        notificationService.error('No fue posible completar la solicitud.');
      }

      return throwError(() => error);
    })
  );
};

