import { Injectable } from '@angular/core';
import { InMemoryDbService } from 'angular-in-memory-web-api';

@Injectable({ providedIn: 'root' })
export class AppInMemoryDataService implements InMemoryDbService {
  createDb() {
    return {
      users: [
        { id: 1, name: 'Jane Doe',      email: 'jane.doe@example.com',      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',  role: 'Admin',  status: 'Active',   joinedDate: '2024-01-15' },
        { id: 2, name: 'John Smith',    email: 'john.smith@example.com',    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',  role: 'Editor', status: 'Active',   joinedDate: '2024-02-20' },
        { id: 3, name: 'Alice Johnson', email: 'alice.johnson@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', role: 'Viewer', status: 'Active',   joinedDate: '2024-03-10' },
        { id: 4, name: 'Bob Martinez',  email: 'bob.martinez@example.com',  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',   role: 'Editor', status: 'Inactive', joinedDate: '2024-04-05' },
        { id: 5, name: 'Carol White',   email: 'carol.white@example.com',   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol', role: 'Viewer', status: 'Active',   joinedDate: '2024-05-18' }
      ]
    };
  }
}
