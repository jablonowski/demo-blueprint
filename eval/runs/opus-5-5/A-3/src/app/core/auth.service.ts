import { Injectable } from '@angular/core';

const STORAGE_KEY = 'isLoggedIn';
const VALID_USERNAME = 'admin';
const VALID_PASSWORD = 'admin';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly displayName = 'Admin User';

  isLoggedIn(): boolean {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  login(username: string, password: string): boolean {
    const ok = username === VALID_USERNAME && password === VALID_PASSWORD;
    if (ok) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    return ok;
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
