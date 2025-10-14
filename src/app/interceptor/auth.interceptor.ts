import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/authService' ; // ajusta ruta
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject<AuthService>(AuthService);
  const router = inject(Router);

  const token = auth.token || localStorage.getItem('token');
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError(err => {
      if (err?.status === 401) {
        auth.logout?.();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};