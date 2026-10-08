import { Component, DestroyRef, inject, signal } from '@angular/core';
import { TagComponent, TagVariant } from '@jablonowski/dsb-components';
import { MetricTileComponent } from './metric-tile.component';

interface ThroughputBar {
  day: string;
  value: number;
}

interface ServiceStatus {
  name: string;
  online: boolean;
}

interface SummaryRow {
  label: string;
  value: string;
}

interface LogLine {
  text: string;
  level: 'info' | 'warn' | 'error';
}

const LOG_POOL: LogLine[] = [
  { text: 'Health check passed for all services.', level: 'info' },
  { text: 'Cache layer evicted 128 stale entries.', level: 'info' },
  { text: 'Request latency spike detected on /api/users.', level: 'warn' },
  { text: 'Analytics Engine connection retry failed.', level: 'error' },
  { text: 'Scheduled backup completed successfully.', level: 'info' },
  { text: 'Auth token refresh cycle completed.', level: 'info' },
  { text: 'Rate limit threshold approaching for client 44210.', level: 'warn' },
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MetricTileComponent, TagComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly throughput: ThroughputBar[] = [
    { day: 'Mon', value: 3200 },
    { day: 'Tue', value: 4100 },
    { day: 'Wed', value: 4820 },
    { day: 'Thu', value: 3900 },
    { day: 'Fri', value: 4500 },
    { day: 'Sat', value: 2100 },
    { day: 'Sun', value: 1800 },
  ];
  protected readonly maxThroughput = Math.max(...this.throughput.map((bar) => bar.value));

  protected readonly services: ServiceStatus[] = [
    { name: 'API Gateway', online: true },
    { name: 'Auth Service', online: true },
    { name: 'Storage Service', online: true },
    { name: 'Analytics Engine', online: false },
    { name: 'Cache Layer', online: true },
  ];

  protected readonly summary: SummaryRow[] = [
    { label: 'Requests/min', value: '4,820' },
    { label: 'Avg Response', value: '142 ms' },
    { label: 'Error Rate', value: '0.04%' },
    { label: 'Uptime (30d)', value: '99.97%' },
  ];

  protected readonly logs = signal<LogLine[]>([
    { text: 'Dashboard session started.', level: 'info' },
  ]);

  constructor() {
    const timer = setInterval(() => {
      const next = LOG_POOL[Math.floor(Math.random() * LOG_POOL.length)];
      this.logs.update((lines) => [...lines, next].slice(-50));
    }, 3000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  protected barHeight(value: number): number {
    return Math.round((value / this.maxThroughput) * 100);
  }

  protected statusVariant(online: boolean): TagVariant {
    return online ? 'success' : 'danger';
  }
}
