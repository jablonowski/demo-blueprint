import { Component, ElementRef, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
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

interface LogLine {
  id: number;
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  source: string;
  message: string;
}

const LOG_TEMPLATES: ReadonlyArray<Omit<LogLine, 'id' | 'time'>> = [
  { level: 'INFO', source: 'api-gateway', message: 'GET /api/users 200 — 38ms' },
  { level: 'INFO', source: 'auth-service', message: 'Token refreshed for session a91f…' },
  { level: 'DEBUG', source: 'cache-layer', message: 'Cache hit ratio 94.2% (window 60s)' },
  { level: 'WARN', source: 'analytics-engine', message: 'Health check timed out after 5000ms' },
  { level: 'INFO', source: 'storage-service', message: 'Snapshot completed — 2.4 GB in 12s' },
  { level: 'INFO', source: 'api-gateway', message: 'POST /api/events 201 — 112ms' },
  { level: 'ERROR', source: 'analytics-engine', message: 'Connection refused: upstream unavailable' },
  { level: 'DEBUG', source: 'scheduler', message: 'Job metrics-rollup queued (priority=low)' },
  { level: 'INFO', source: 'auth-service', message: 'User admin signed in from 10.0.4.17' },
  { level: 'WARN', source: 'api-gateway', message: 'p95 latency above 250ms on /api/search' },
];

@Component({
  selector: 'app-dashboard',
  imports: [TagComponent, ListComponent, ListItemComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly logViewport = viewChild.required<ElementRef<HTMLElement>>('logViewport');
  private timer?: ReturnType<typeof setInterval>;
  private nextLogId = 0;

  readonly metrics: Metric[] = [
    { title: 'Active Users', value: '1,284', trend: { label: '+12%', positive: true }, subLabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', positive: true }, subLabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', positive: false }, subLabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', positive: true }, subLabel: 'last 30 days' },
  ];

  readonly throughput = (() => {
    const days = [
      { day: 'Mon', requests: 3820 },
      { day: 'Tue', requests: 4410 },
      { day: 'Wed', requests: 4960 },
      { day: 'Thu', requests: 4280 },
      { day: 'Fri', requests: 5240 },
      { day: 'Sat', requests: 2870 },
      { day: 'Sun', requests: 2310 },
    ];
    const max = Math.max(...days.map((d) => d.requests));
    return days.map((d) => ({ ...d, percent: Math.round((d.requests / max) * 100) }));
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

  trendVariant(positive: boolean): TagVariant {
    return positive ? 'success' : 'danger';
  }

  ngOnInit(): void {
    for (let i = 0; i < 6; i++) {
      this.appendLog();
    }
    this.timer = setInterval(() => this.appendLog(), 3000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  private appendLog(): void {
    const template = LOG_TEMPLATES[this.nextLogId % LOG_TEMPLATES.length];
    const line: LogLine = {
      ...template,
      id: this.nextLogId++,
      time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
    };
    this.logs.update((lines) => [...lines.slice(-99), line]);
    queueMicrotask(() => {
      const el = this.logViewport().nativeElement;
      el.scrollTop = el.scrollHeight;
    });
  }
}
