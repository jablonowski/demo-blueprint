import { Component, DestroyRef, ElementRef, afterRenderEffect, inject, signal, viewChild } from '@angular/core';
import { ListComponent, ListItemComponent, TagComponent, TagVariant } from '@jablonowski/dsb-components';

interface Metric {
  title: string;
  value: string;
  trend?: { label: string; positive: boolean };
  subLabel?: string;
}

interface LogLine {
  id: number;
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
}

const LOG_TEMPLATES: Omit<LogLine, 'id' | 'time'>[] = [
  { level: 'INFO', message: 'api-gateway: GET /api/users 200 (38ms)' },
  { level: 'INFO', message: 'auth-service: token refreshed for session a91f' },
  { level: 'DEBUG', message: 'cache-layer: hit ratio 94.2% over last 60s' },
  { level: 'WARN', message: 'analytics-engine: heartbeat missed, retrying (3/5)' },
  { level: 'INFO', message: 'storage-service: snapshot completed in 1.4s' },
  { level: 'ERROR', message: 'analytics-engine: connection refused on :9042' },
  { level: 'INFO', message: 'api-gateway: POST /api/sessions 201 (52ms)' },
  { level: 'DEBUG', message: 'scheduler: job cleanup-temp queued' },
];

@Component({
  selector: 'app-dashboard',
  imports: [TagComponent, ListComponent, ListItemComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  readonly metrics: Metric[] = [
    { title: 'Active Users', value: '1,284', trend: { label: '+12%', positive: true }, subLabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', positive: true }, subLabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', positive: false }, subLabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', positive: true }, subLabel: 'last 30 days' },
  ];

  private readonly throughputRaw = [
    { day: 'Mon', value: 3820 },
    { day: 'Tue', value: 4460 },
    { day: 'Wed', value: 4120 },
    { day: 'Thu', value: 4980 },
    { day: 'Fri', value: 4820 },
    { day: 'Sat', value: 2640 },
    { day: 'Sun', value: 2210 },
  ];

  private readonly throughputMax = Math.max(...this.throughputRaw.map((d) => d.value));

  readonly throughput = this.throughputRaw.map((d) => ({
    ...d,
    percent: Math.round((d.value / this.throughputMax) * 100),
  }));

  readonly services: { name: string; online: boolean }[] = [
    { name: 'API Gateway', online: true },
    { name: 'Auth Service', online: true },
    { name: 'Storage Service', online: true },
    { name: 'Analytics Engine', online: false },
    { name: 'Cache Layer', online: true },
  ];

  readonly summary: { label: string; value: string }[] = [
    { label: 'Requests/min', value: '4,820' },
    { label: 'Avg Response', value: '142 ms' },
    { label: 'Error Rate', value: '0.04%' },
    { label: 'Uptime (30d)', value: '99.97%' },
  ];

  readonly logs = signal<LogLine[]>([]);
  private readonly logViewer = viewChild<ElementRef<HTMLElement>>('logViewer');
  private nextLogId = 0;

  constructor() {
    for (let i = 0; i < 6; i++) {
      this.appendLog(new Date(Date.now() - (6 - i) * 3000));
    }
    const timer = setInterval(() => this.appendLog(new Date()), 3000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));

    // Keep the newest line in view as lines are appended.
    afterRenderEffect(() => {
      this.logs();
      const el = this.logViewer()?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }

  trendVariant(metric: Metric): TagVariant {
    return metric.trend?.positive ? 'success' : 'danger';
  }

  private appendLog(at: Date): void {
    const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
    const line: LogLine = { id: this.nextLogId++, time: at.toLocaleTimeString('en-GB'), ...template };
    this.logs.update((lines) => [...lines, line].slice(-100));
  }
}
