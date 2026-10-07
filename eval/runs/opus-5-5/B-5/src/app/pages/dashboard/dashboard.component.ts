import { Component, DestroyRef, ElementRef, afterRender, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ListComponent, ListItemComponent, TagComponent, TagVariant } from '@jablonowski/dsb-components';

interface Metric {
  title: string;
  value: string;
  trend?: { label: string; positive: boolean };
  subLabel?: string;
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
  source: string;
  message: string;
}

const LOG_TEMPLATES: Array<Pick<LogLine, 'level' | 'source' | 'message'>> = [
  { level: 'INFO', source: 'api-gateway', message: 'GET /api/users 200 in 138ms' },
  { level: 'INFO', source: 'auth-service', message: 'Token refreshed for session a3f9…c21' },
  { level: 'DEBUG', source: 'cache-layer', message: 'Cache hit ratio 94.2% (window 60s)' },
  { level: 'INFO', source: 'storage', message: 'Snapshot vol-0412 completed (2.4 GB)' },
  { level: 'WARN', source: 'analytics', message: 'Health check timed out after 5000ms' },
  { level: 'INFO', source: 'api-gateway', message: 'POST /api/events 201 in 92ms' },
  { level: 'ERROR', source: 'analytics', message: 'Connection refused: analytics-engine:7070' },
  { level: 'INFO', source: 'scheduler', message: 'Job metrics-rollup finished in 1.8s' },
  { level: 'DEBUG', source: 'auth-service', message: 'JWKS cache warmed (3 keys)' },
  { level: 'INFO', source: 'api-gateway', message: 'PUT /api/users/2 200 in 154ms' },
];

const MAX_LOG_LINES = 200;

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, ListComponent, ListItemComponent, TagComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  readonly lastUpdated = new Date();

  readonly metrics: Metric[] = [
    { title: 'Active Users', value: '1,284', trend: { label: '+12%', positive: true }, subLabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', positive: true }, subLabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', positive: false }, subLabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', positive: true }, subLabel: 'last 30 days' },
  ];

  private readonly throughputRaw = [
    { day: 'Mon', value: 4120 },
    { day: 'Tue', value: 4630 },
    { day: 'Wed', value: 5210 },
    { day: 'Thu', value: 4890 },
    { day: 'Fri', value: 5480 },
    { day: 'Sat', value: 3240 },
    { day: 'Sun', value: 2870 },
  ];

  readonly throughput = (() => {
    const max = Math.max(...this.throughputRaw.map(d => d.value));
    return this.throughputRaw.map(d => ({ ...d, percent: Math.round((d.value / max) * 100) }));
  })();

  readonly services: ServiceStatus[] = [
    { name: 'API Gateway', online: true },
    { name: 'Auth Service', online: true },
    { name: 'Storage Service', online: true },
    { name: 'Analytics Engine', online: false },
    { name: 'Cache Layer', online: true },
  ];

  readonly summary = [
    { label: 'Requests/min', value: '4,820' },
    { label: 'Avg Response', value: '142 ms' },
    { label: 'Error Rate', value: '0.04%' },
    { label: 'Uptime (30d)', value: '99.97%' },
  ];

  readonly logs = signal<LogLine[]>([]);
  private readonly logViewport = viewChild.required<ElementRef<HTMLElement>>('logViewport');
  private nextLogId = 0;
  private stickToBottom = true;

  constructor() {
    // Seed a few lines so the viewer is never empty, then append one every 3 seconds.
    const now = Date.now();
    this.logs.set(Array.from({ length: 6 }, (_, i) => this.createLog(new Date(now - (6 - i) * 3000))));

    const timer = setInterval(() => {
      this.logs.update(lines => [...lines, this.createLog(new Date())].slice(-MAX_LOG_LINES));
    }, 3000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));

    afterRender(() => {
      const el = this.logViewport().nativeElement;
      if (this.stickToBottom) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }

  onLogScroll(el: HTMLElement): void {
    // Follow new lines only while the reader is at the bottom.
    this.stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
  }

  trendVariant(metric: Metric): TagVariant {
    return metric.trend?.positive ? 'success' : 'danger';
  }

  private createLog(time: Date): LogLine {
    const template = LOG_TEMPLATES[this.nextLogId % LOG_TEMPLATES.length];
    return { id: this.nextLogId++, time, ...template };
  }
}
