import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id?: number;
  name: string;
  email: string;
  avatar: string;
  role: string;
  status: string;
  joinedDate: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private url = 'api/users';

  getAll(): Observable<User[]>          { return this.http.get<User[]>(this.url); }
  getById(id: number): Observable<User> { return this.http.get<User>(`${this.url}/${id}`); }
  create(user: Omit<User, 'id'>): Observable<User>       { return this.http.post<User>(this.url, user); }
  update(id: number, user: Partial<User>): Observable<User> { return this.http.put<User>(`${this.url}/${id}`, { id, ...user }); }
  delete(id: number): Observable<unknown>                { return this.http.delete(`${this.url}/${id}`); }
}
