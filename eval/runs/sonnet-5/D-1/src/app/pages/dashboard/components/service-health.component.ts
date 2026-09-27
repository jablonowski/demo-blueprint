import { Component } from '@angular/core';
import { TagComponent } from '@jablonowski/dsb-components';

interface Service {
  name: string;
  online: boolean;
}

@Component({
  selector: 'app-service-health',
  standalone: true,
  imports: [TagComponent],
  templateUrl: './service-health.component.html',
  styleUrl: './service-health.component.css'
})
export class ServiceHealthComponent {
  readonly services: Service[] = [
    { name: 'API Gateway', online: true },
    { name: 'Auth Service', online: true },
    { name: 'Storage Service', online: true },
    { name: 'Analytics Engine', online: false },
    { name: 'Cache Layer', online: true }
  ];
}
