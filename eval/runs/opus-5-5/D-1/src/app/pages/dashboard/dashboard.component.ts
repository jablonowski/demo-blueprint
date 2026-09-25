import { Component, DestroyRef, ElementRef, afterRenderEffect, inject, signal, viewChild } from '@angular/core';
import { ListComponent, ListItemComponent, TagComponent, TagVariant } from '@jablonowski/dsb-components';

interface MetricTile {
  title: string;
  value: string;
  trend?: { label: string; direction: 'positive' | 'negative' };
  subLabel?: string;
}

interface ThroughputBar {
  day: string;
  value: number;
}

interface ServiceStatus {
  name: string;
  online: boolean;
}

type LogLevel = 'INFO' | 'DEBUG' | 'WARN' | 'ERROR' | 'OK';

interface LogLine {
  id: number;
  time: string;
  level: LogLevel;
  source: string;
  message: string;
}

const LOG_TEMPLATES: Array<Pick<LogLine, 'level' | 'source' | 'message'>> = [
  { level: 'INFO', source: 'api-gateway', message: 'GET /api/users 200 in 38ms' },
  { level: 'OK', source: 'deploy', message: 'Production deployed from commit a3f92b1' },
  { level: 'DEBUG', source: 'cache-layer', message: 'Cache hit ratio 94.2% (window 60s)' },
  { level: 'INFO', source: 'auth-service', message: 'Token refreshed for session 7f3c…' },
  { level: 'WARN', source: 'storage', message: 'Disk usage at 78% on volume /data' },
  { level: 'ERROR', source: 'analytics', message: 'Connection refused: analytics-engine:9090' },
  { level: 'INFO', source: 'api-gateway', message: 'POST /api/events 201 in 52ms' },
  { level: 'DEBUG', source: 'scheduler', message: 'Job cleanup-sessions finished in 1.2s' },
  { level: 'WARN', source: 'api-gateway', message: 'p95 latency 312ms above 300ms threshold' },
  { level: 'INFO', source: 'auth-service', message: 'User admin signed in' },
];

@Component({
  selector: 'app-dashboard',
  imports: [TagComponent, ListComponent, ListItemComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  readonly metrics: MetricTile[] = [
    { title: 'Active Users', value: '1,284', trend: { label: '+12%', direction: 'positive' }, subLabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', direction: 'positive' }, subLabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', direction: 'negative' }, subLabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', direction: 'positive' }, subLabel: 'last 30 days' },
  ];

  private readonly throughputRaw: ThroughputBar[] = [
    { day: 'Mon', value: 4210 },
    { day: 'Tue', value: 4980 },
    { day: 'Wed', value: 5630 },
    { day: 'Thu', value: 5120 },
    { day: 'Fri', value: 6040 },
    { day: 'Sat', value: 3480 },
    { day: 'Sun', value: 2970 },
  ];

  private readonly throughputMax = Math.max(...this.throughputRaw.map((b) => b.value));

  readonly throughput = this.throughputRaw.map((b) => ({
    ...b,
    percent: Math.round((b.value / this.throughputMax) * 100),
  }));

  readonly throughputLabel =
    'Request throughput by day: ' + this.throughput.map((b) => `${b.day} ${b.value} requests per minute`).join(', ');

  readonly services: ServiceStatus[] = [
    { name: 'API Gateway', online: true },
    { name: 'Auth Service', online: true },
    { name: 'Storage Service', online: true },
    { name: 'Analytics Engine', online: false },
    { name: 'Cache Layer', online: true },
  ];

  readonly summary: Array<{ label: string; value: string }> = [
    { label: 'Requests/min', value: '4,820' },
    { label: 'Avg Response', value: '142 ms' },
    { label: 'Error Rate', value: '0.04%' },
    { label: 'Uptime (30d)', value: '99.97%' },
  ];

  readonly lastUpdated = new Date().toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  }) + ' UTC';

  readonly logs = signal<LogLine[]>([]);
  private nextLogId = 0;
  private templateIndex = 0;

  private readonly logViewport = viewChild<ElementRef<HTMLElement>>('logViewport');

  constructor() {
    const seedStart = Date.now() - 8 * 3000;
    for (let i = 0; i < 8; i++) this.appendLog(new Date(seedStart + i * 3000));

    const timer = setInterval(() => this.appendLog(new Date()), 3000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));

    // Keep the newest line in view as lines arrive.
    afterRenderEffect(() => {
      this.logs();
      const el = this.logViewport()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  trendVariant(direction: 'positive' | 'negative'): TagVariant {
    return direction === 'positive' ? 'success' : 'danger';
  }

  private appendLog(at: Date): void {
    const template = LOG_TEMPLATES[this.templateIndex++ % LOG_TEMPLATES.length];
    const line: LogLine = { id: this.nextLogId++, time: at.toISOString().slice(11, 19), ...template };
    this.logs.update((lines) => [...lines, line].slice(-200));
  }
}
