import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { MetricTileComponent } from './components/metric-tile.component';
import { ThroughputChartComponent, ThroughputPoint } from './components/throughput-chart.component';
import { ServiceHealthComponent, ServiceStatus } from './components/service-health.component';
import { DataSummaryComponent, DataSummaryItem } from './components/data-summary.component';
import { SystemLogsComponent } from './components/system-logs.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    MetricTileComponent,
    ThroughputChartComponent,
    ServiceHealthComponent,
    DataSummaryComponent,
    SystemLogsComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  lastUpdated = new Date();

  throughput: ThroughputPoint[] = [
    { label: 'Mon', value: 65 },
    { label: 'Tue', value: 80 },
    { label: 'Wed', value: 72 },
    { label: 'Thu', value: 90 },
    { label: 'Fri', value: 100 },
    { label: 'Sat', value: 45 },
    { label: 'Sun', value: 38 }
  ];

  services: ServiceStatus[] = [
    { name: 'API Gateway', status: 'Online' },
    { name: 'Auth Service', status: 'Online' },
    { name: 'Storage Service', status: 'Online' },
    { name: 'Analytics Engine', status: 'Offline' },
    { name: 'Cache Layer', status: 'Online' }
  ];

  summary: DataSummaryItem[] = [
    { label: 'Requests/min', value: '4,820' },
    { label: 'Avg Response', value: '142 ms' },
    { label: 'Error Rate', value: '0.04%' },
    { label: 'Uptime (30d)', value: '99.97%' }
  ];
}
