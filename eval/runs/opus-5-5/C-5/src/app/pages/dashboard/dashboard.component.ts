import { Component, DestroyRef, ElementRef, afterRender, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ListComponent, ListItemComponent, TagComponent, TagVariant } from '@jablonowski/dsb-components';

interface MetricTile {
  title: string;
  value: string;
  trend?: { label: string; variant: TagVariant };
  subLabel?: string;
}

interface ThroughputBar {
  day: string;
  requests: number;
}

interface ServiceStatus {
  name: string;
  online: boolean;
}

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogLine {
  id: number;
  time: Date;
  level: LogLevel;
  message: string;
}

const LOG_TEMPLATES: ReadonlyArray<{ level: LogLevel; message: string }> = [
  { level: 'INFO', message: 'api-gateway: GET /api/users 200 in 38ms' },
  { level: 'INFO', message: 'auth-service: token refreshed for session 7f3a' },
  { level: 'DEBUG', message: 'cache-layer: hit ratio 0.94 over last 60s' },
  { level: 'INFO', message: 'storage-service: snapshot completed (2.4 GB)' },
  { level: 'WARN', message: 'api-gateway: p95 latency 312ms above 300ms threshold' },
  { level: 'ERROR', message: 'analytics-engine: health check failed, connection refused' },
  { level: 'INFO', message: 'auth-service: user admin signed in' },
  { level: 'DEBUG', message: 'scheduler: queued 12 background jobs' },
  { level: 'INFO', message: 'api-gateway: POST /api/users 201 in 54ms' },
  { level: 'WARN', message: 'cache-layer: eviction rate rising (1.2k/min)' },
];

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, TagComponent, ListComponent, ListItemComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private readonly logViewport = viewChild<ElementRef<HTMLElement>>('logViewport');
  private nextLogId = 0;
  private lastRenderedLogCount = 0;

  readonly lastUpdated = new Date();

  readonly metrics: MetricTile[] = [
    { title: 'Active Users', value: '1,284', trend: { label: '+12%', variant: 'success' }, subLabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', variant: 'success' }, subLabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', variant: 'warning' }, subLabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', variant: 'success' }, subLabel: 'last 30 days' },
  ];

  readonly throughput: ThroughputBar[] = [
    { day: 'Mon', requests: 4120 },
    { day: 'Tue', requests: 4630 },
    { day: 'Wed', requests: 5210 },
    { day: 'Thu', requests: 4890 },
    { day: 'Fri', requests: 5640 },
    { day: 'Sat', requests: 3380 },
    { day: 'Sun', requests: 2970 },
  ];

  private readonly maxThroughput = Math.max(...this.throughput.map((b) => b.requests));

  readonly services: ServiceStatus[] = [
    { name: 'API Gateway', online: true },
    { name: 'Auth Service', online: true },
    { name: 'Storage Service', online: true },
    { name: 'Analytics Engine', online: false },
    { name: 'Cache Layer', online: true },
  ];

  readonly summary: ReadonlyArray<{ label: string; value: string }> = [
    { label: 'Requests/min', value: '4,820' },
    { label: 'Avg Response', value: '142 ms' },
    { label: 'Error Rate', value: '0.04%' },
    { label: 'Uptime (30d)', value: '99.97%' },
  ];

  readonly logs = signal<LogLine[]>([]);

  constructor() {
    for (let i = 0; i < 8; i++) {
      this.appendLog(new Date(Date.now() - (8 - i) * 3000));
    }
    const timer = setInterval(() => this.appendLog(new Date()), 3000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));

    // Keep the newest line in view, like a tailing terminal.
    afterRender(() => {
      const el = this.logViewport()?.nativeElement;
      const count = this.logs().length;
      if (el && count !== this.lastRenderedLogCount) {
        this.lastRenderedLogCount = count;
        el.scrollTop = el.scrollHeight;
      }
    });
  }

  barHeight(bar: ThroughputBar): number {
    return Math.round((bar.requests / this.maxThroughput) * 100);
  }

  private appendLog(time: Date): void {
    const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
    const line: LogLine = { id: this.nextLogId++, time, ...template };
    // Cap the buffer so a long-open dashboard does not grow without bound.
    this.logs.update((lines) => [...lines, line].slice(-200));
  }
}
