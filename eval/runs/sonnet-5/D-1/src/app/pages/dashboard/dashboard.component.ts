import { Component } from '@angular/core';
import { MetricTileComponent } from './components/metric-tile.component';
import { ThroughputChartComponent } from './components/throughput-chart.component';
import { ServiceHealthComponent } from './components/service-health.component';
import { DataSummaryComponent } from './components/data-summary.component';
import { SystemLogsComponent } from './components/system-logs.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MetricTileComponent,
    ThroughputChartComponent,
    ServiceHealthComponent,
    DataSummaryComponent,
    SystemLogsComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {}
