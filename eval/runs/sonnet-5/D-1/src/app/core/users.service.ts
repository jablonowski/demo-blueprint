import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Member } from './models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private baseUrl = '/api/users';

  getAll(): Observable<Member[]> {
    return this.http.get<Member[]>(this.baseUrl);
  }

  getById(id: number): Observable<Member> {
    return this.http.get<Member>(`${this.baseUrl}/${id}`);
  }

  create(user: Omit<Member, 'id'>): Observable<Member> {
    return this.http.post<Member>(this.baseUrl, user);
  }

  update(id: number, user: Partial<Member>): Observable<Member> {
    // angular-in-memory-web-api's PUT handler reads `id` from the request
    // body (not the URL) to locate the record to replace, so it must be
    // included here even though the URL already carries it.
    return this.http.put<Member>(`${this.baseUrl}/${id}`, { ...user, id });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
