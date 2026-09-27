import { Injectable } from '@angular/core';

const KEY = 'isLoggedIn';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isLoggedIn(): boolean {
    return localStorage.getItem(KEY) === 'true';
  }

  login(username: string, password: string): boolean {
    const ok = username === 'admin' && password === 'admin';
    if (ok) localStorage.setItem(KEY, 'true');
    return ok;
  }

  logout(): void {
    localStorage.removeItem(KEY);
  }
}
