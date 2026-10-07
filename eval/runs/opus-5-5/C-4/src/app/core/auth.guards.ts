import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Protects the authenticated shell; unauthenticated visitors go to /login. */
export const authGuard: CanActivateFn = () =>
  inject(AuthService).isLoggedIn() ? true : inject(Router).createUrlTree(['/login']);

/** Keeps signed-in users away from the login page. */
export const loginGuard: CanActivateFn = () =>
  inject(AuthService).isLoggedIn() ? inject(Router).createUrlTree(['/dashboard']) : true;
