import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ListComponent, ListItemComponent } from '@jablonowski/dsb-components';
import { LogViewerComponent } from './components/log-viewer/log-viewer.component';
import { StatTileComponent } from './components/stat-tile/stat-tile.component';
import { ThroughputChartComponent } from './components/throughput-chart/throughput-chart.component';

interface ServiceStatus {
  name: string;
  online: boolean;
}

interface SummaryRow {
  label: string;
  value: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, StatTileComponent, ThroughputChartComponent, LogViewerComponent, ListComponent, ListItemComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  services: ServiceStatus[] = [
    { name: 'API Gateway', online: true },
    { name: 'Auth Service', online: true },
    { name: 'Storage Service', online: true },
    { name: 'Analytics Engine', online: false },
    { name: 'Cache Layer', online: true },
  ];

  summaryRows: SummaryRow[] = [
    { label: 'Requests/min', value: '4,820' },
    { label: 'Avg Response', value: '142 ms' },
    { label: 'Error Rate', value: '0.04%' },
    { label: 'Uptime (30d)', value: '99.97%' },
  ];
}
