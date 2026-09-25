import { Injectable } from '@angular/core';

const STORAGE_KEY = 'isLoggedIn';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isLoggedIn(): boolean {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  login(username: string, password: string): boolean {
    if (username !== 'admin' || password !== 'admin') {
      return false;
    }
    localStorage.setItem(STORAGE_KEY, 'true');
    return true;
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
