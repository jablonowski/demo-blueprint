import { Injectable } from '@angular/core';

const STORAGE_KEY = 'isLoggedIn';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isLoggedIn(): boolean {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  login(username: string, password: string): boolean {
    const valid = username === 'admin' && password === 'admin';
    if (valid) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    return valid;
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
