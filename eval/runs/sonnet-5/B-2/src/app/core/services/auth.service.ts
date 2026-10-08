import { Injectable } from '@angular/core';

const STORAGE_KEY = 'isLoggedIn';
const USERNAME = 'admin';
const PASSWORD = 'admin';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isLoggedIn(): boolean {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  login(username: string, password: string): boolean {
    const ok = username === USERNAME && password === PASSWORD;
    if (ok) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    return ok;
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
