import { Component } from '@angular/core';
import { MetricTileComponent } from './components/metric-tile/metric-tile.component';
import { ThroughputChartComponent } from './components/throughput-chart/throughput-chart.component';
import { ServiceHealthComponent } from './components/service-health/service-health.component';
import { DataSummaryComponent } from './components/data-summary/data-summary.component';
import { SystemLogsComponent } from './components/system-logs/system-logs.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MetricTileComponent, ThroughputChartComponent, ServiceHealthComponent, DataSummaryComponent, SystemLogsComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {}
