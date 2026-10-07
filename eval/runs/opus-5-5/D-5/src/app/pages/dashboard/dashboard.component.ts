import { Component, ElementRef, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ListComponent, ListItemComponent, TagComponent, TagVariant } from '@jablonowski/dsb-components';

interface Metric {
  title: string;
  value: string;
  trend?: { label: string; variant: TagVariant };
  subLabel?: string;
}

interface LogLine {
  id: number;
  time: Date;
  level: 'INFO' | 'WARN' | 'ERROR';
  source: string;
  message: string;
}

const LOG_TEMPLATES: Omit<LogLine, 'id' | 'time'>[] = [
  { level: 'INFO', source: 'api-gateway', message: 'GET /api/users 200 in 128ms' },
  { level: 'INFO', source: 'auth-service', message: 'Token refreshed for session a3f92b1' },
  { level: 'INFO', source: 'storage', message: 'Snapshot uploaded (2.4 MB)' },
  { level: 'WARN', source: 'cache-layer', message: 'Hit ratio below 80% for 60s' },
  { level: 'INFO', source: 'api-gateway', message: 'POST /api/users 201 in 214ms' },
  { level: 'ERROR', source: 'analytics', message: 'Connection refused: analytics-engine:9000' },
  { level: 'INFO', source: 'scheduler', message: 'Job nightly-report queued' },
  { level: 'WARN', source: 'api-gateway', message: 'p95 latency 312ms above 300ms threshold' },
];

const MAX_LOG_LINES = 50;

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, TagComponent, ListComponent, ListItemComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly lastUpdated = new Date();

  readonly metrics: Metric[] = [
    { title: 'Active Users', value: '1,284', trend: { label: '+12%', variant: 'success' }, subLabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', variant: 'success' }, subLabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', variant: 'danger' }, subLabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', variant: 'success' }, subLabel: 'last 30 days' },
  ];

  private readonly throughputRaw = [
    { day: 'Mon', value: 3920 },
    { day: 'Tue', value: 4410 },
    { day: 'Wed', value: 5180 },
    { day: 'Thu', value: 4820 },
    { day: 'Fri', value: 5630 },
    { day: 'Sat', value: 2970 },
    { day: 'Sun', value: 2540 },
  ];

  readonly throughput = (() => {
    const max = Math.max(...this.throughputRaw.map((d) => d.value));
    return this.throughputRaw.map((d) => ({ ...d, percent: Math.round((d.value / max) * 100) }));
  })();

  readonly services: { name: string; online: boolean }[] = [
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
  private readonly terminal = viewChild.required<ElementRef<HTMLElement>>('terminal');
  private nextLogId = 0;
  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    const now = Date.now();
    this.logs.set(
      Array.from({ length: 6 }, (_, i) => this.makeLog(new Date(now - (6 - i) * 3000))),
    );
    this.timer = setInterval(() => {
      const el = this.terminal().nativeElement;
      // Follow the tail unless the reader has scrolled up to look at older lines.
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < el.clientHeight / 4;
      this.logs.update((lines) => [...lines, this.makeLog(new Date())].slice(-MAX_LOG_LINES));
      if (atBottom) {
        setTimeout(() => (el.scrollTop = el.scrollHeight));
      }
    }, 3000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  private makeLog(time: Date): LogLine {
    const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
    return { id: this.nextLogId++, time, ...template };
  }
}
