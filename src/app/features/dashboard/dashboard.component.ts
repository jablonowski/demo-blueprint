import { Component } from '@angular/core';
import { TagComponent, ListComponent, ListItemComponent } from '@jablonowski/dsb-components';
import { MetricCardComponent } from '../../shared/components/metric-card/metric-card.component';
import { ThroughputChartComponent } from '../../shared/components/throughput-chart/throughput-chart.component';
import { LogsCardComponent } from '../../shared/components/logs-card/logs-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [TagComponent, ListComponent, ListItemComponent, MetricCardComponent, ThroughputChartComponent, LogsCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {}
