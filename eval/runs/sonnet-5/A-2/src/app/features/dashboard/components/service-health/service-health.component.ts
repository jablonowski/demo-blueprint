import { Component } from '@angular/core';

interface ServiceStatus {
  name: string;
  online: boolean;
}

@Component({
  selector: 'app-service-health',
  standalone: true,
  imports: [],
  templateUrl: './service-health.component.html',
  styleUrl: './service-health.component.scss'
})
export class ServiceHealthComponent {
  readonly services: ServiceStatus[] = [
    { name: 'API Gateway', online: true },
    { name: 'Auth Service', online: true },
    { name: 'Storage Service', online: true },
    { name: 'Analytics Engine', online: false },
    { name: 'Cache Layer', online: true }
  ];
}
