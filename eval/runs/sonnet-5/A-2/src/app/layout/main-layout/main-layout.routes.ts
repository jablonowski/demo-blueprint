import { Routes } from '@angular/router';

export const MAIN_LAYOUT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('../../features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('../../features/users/users.component').then((m) => m.UsersComponent)
      }
    ]
  }
];
