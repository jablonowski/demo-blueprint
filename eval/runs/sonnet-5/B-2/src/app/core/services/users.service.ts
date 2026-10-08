import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

const BASE_URL = '/api/users';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(BASE_URL);
  }

  getById(id: number): Observable<User> {
    return this.http.get<User>(`${BASE_URL}/${id}`);
  }

  create(user: Partial<User>): Observable<User> {
    return this.http.post<User>(BASE_URL, user);
  }

  update(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${BASE_URL}/${id}`, { ...user, id });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE_URL}/${id}`);
  }
}
