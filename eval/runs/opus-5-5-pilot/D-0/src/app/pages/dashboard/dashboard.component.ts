import { Component, DestroyRef, ElementRef, afterRender, inject, signal, viewChild } from '@angular/core';
import { ListComponent, ListItemComponent, TagComponent } from '@jablonowski/dsb-components';

interface Metric {
  title: string;
  value: string;
  trend?: { label: string; positive: boolean };
  subLabel?: string;
}

interface LogLine {
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

const LOG_TEMPLATES: Omit<LogLine, 'time'>[] = [
  { level: 'INFO', message: 'GET /api/users 200 — 38ms' },
  { level: 'INFO', message: 'api-gateway: health check passed' },
  { level: 'INFO', message: 'auth-service: token refreshed for session 8f2c' },
  { level: 'WARN', message: 'cache-layer: hit ratio dropped to 87%' },
  { level: 'INFO', message: 'storage-service: snapshot completed (2.4 GB)' },
  { level: 'ERROR', message: 'analytics-engine: connection refused, retrying in 5s' },
  { level: 'INFO', message: 'POST /api/users 201 — 64ms' },
  { level: 'INFO', message: 'scheduler: job metrics-rollup finished' },
  { level: 'WARN', message: 'api-gateway: p95 latency above 250ms' },
  { level: 'INFO', message: 'PUT /api/users/3 200 — 41ms' },
];

@Component({
  selector: 'app-dashboard',
  imports: [ListComponent, ListItemComponent, TagComponent],
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
    { day: 'Tue', value: 4410 },
    { day: 'Wed', value: 4980 },
    { day: 'Thu', value: 4620 },
    { day: 'Fri', value: 5240 },
    { day: 'Sat', value: 2870 },
    { day: 'Sun', value: 2310 },
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

  readonly logs = signal<LogLine[]>([]);
  private readonly logViewport = viewChild<ElementRef<HTMLElement>>('logViewport');
  private logCursor = 0;
  private stickToBottom = true;

  constructor() {
    for (let i = 0; i < 6; i++) {
      this.appendLog();
    }
    const timer = setInterval(() => this.appendLog(), 3000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));

    afterRender(() => {
      const el = this.logViewport()?.nativeElement;
      if (el && this.stickToBottom) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }

  onLogScroll(el: HTMLElement): void {
    this.stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
  }

  private appendLog(): void {
    const template = LOG_TEMPLATES[this.logCursor++ % LOG_TEMPLATES.length];
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    this.logs.update((lines) => [...lines, { time, ...template }].slice(-200));
  }
}
