import { Injectable } from '@angular/core';

const KEY = 'isLoggedIn';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly userName = 'Admin User';

  isLoggedIn(): boolean {
    return localStorage.getItem(KEY) === 'true';
  }

  login(username: string, password: string): boolean {
    if (username === 'admin' && password === 'admin') {
      localStorage.setItem(KEY, 'true');
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem(KEY);
  }
}
