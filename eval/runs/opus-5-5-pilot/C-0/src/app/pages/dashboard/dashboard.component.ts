import { Component, DestroyRef, ElementRef, afterRenderEffect, inject, signal, viewChild } from '@angular/core';
import { ListComponent, ListItemComponent, TagComponent, TagVariant } from '@jablonowski/dsb-components';

interface Metric {
  title: string;
  value: string;
  trend?: string;
  trendVariant?: TagVariant;
  trendLabel?: string;
  subLabel?: string;
}

interface LogLine {
  id: number;
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
}

const LOG_TEMPLATES: Array<Pick<LogLine, 'level' | 'message'>> = [
  { level: 'INFO', message: 'api-gateway: GET /api/users 200 (38ms)' },
  { level: 'INFO', message: 'auth-service: token refreshed for session 7f3a' },
  { level: 'DEBUG', message: 'cache-layer: hit ratio 94.2% over last 60s' },
  { level: 'WARN', message: 'analytics-engine: heartbeat missed, retrying' },
  { level: 'INFO', message: 'storage-service: snapshot completed (1.2 GB)' },
  { level: 'ERROR', message: 'analytics-engine: connection refused on :9092' },
  { level: 'INFO', message: 'api-gateway: POST /api/events 202 (51ms)' },
  { level: 'DEBUG', message: 'scheduler: 12 jobs queued, 0 stalled' },
];

@Component({
  selector: 'app-dashboard',
  imports: [TagComponent, ListComponent, ListItemComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private readonly logViewer = viewChild.required<ElementRef<HTMLElement>>('logViewer');

  readonly metrics: Metric[] = [
    { title: 'Active Users', value: '1,284', trend: '+12%', trendVariant: 'success', trendLabel: 'up, positive', subLabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: '-8ms', trendVariant: 'success', trendLabel: 'down, positive', subLabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: '+0.01%', trendVariant: 'danger', trendLabel: 'up, negative', subLabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: 'Stable', trendVariant: 'success', trendLabel: 'positive', subLabel: 'last 30 days' },
  ];

  private readonly throughputRaw = [
    { day: 'Mon', value: 3120 },
    { day: 'Tue', value: 4280 },
    { day: 'Wed', value: 3890 },
    { day: 'Thu', value: 4820 },
    { day: 'Fri', value: 4510 },
    { day: 'Sat', value: 2340 },
    { day: 'Sun', value: 1980 },
  ];

  readonly throughput = (() => {
    const max = Math.max(...this.throughputRaw.map((d) => d.value));
    return this.throughputRaw.map((d) => ({ ...d, percent: Math.round((d.value / max) * 100) }));
  })();

  readonly services = [
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

  private nextLogId = 0;
  readonly logs = signal<LogLine[]>([]);

  constructor() {
    for (let i = 0; i < 6; i++) this.appendLog();

    const timer = setInterval(() => this.appendLog(), 3000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));

    afterRenderEffect(() => {
      this.logs();
      const el = this.logViewer().nativeElement;
      el.scrollTop = el.scrollHeight;
    });
  }

  private appendLog(): void {
    const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    this.logs.update((lines) => [...lines.slice(-199), { id: this.nextLogId++, time, ...template }]);
  }
}
