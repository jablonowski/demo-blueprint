import { Component, ElementRef, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ListComponent, ListItemComponent, TagComponent } from '@jablonowski/dsb-components';

interface MetricTile {
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
  time: string;
  level: LogLevel;
  message: string;
}

const LOG_TEMPLATES: { level: LogLevel; message: string }[] = [
  { level: 'INFO', message: 'api-gateway: GET /api/users 200 in 38ms' },
  { level: 'INFO', message: 'auth-service: token refreshed for session 7f3a' },
  { level: 'DEBUG', message: 'cache-layer: hit ratio 94.2% over last 60s' },
  { level: 'INFO', message: 'storage-service: snapshot written to bucket eu-west-1' },
  { level: 'WARN', message: 'api-gateway: p95 latency 318ms above 300ms threshold' },
  { level: 'ERROR', message: 'analytics-engine: health check failed, connection refused' },
  { level: 'INFO', message: 'api-gateway: POST /api/sessions 201 in 54ms' },
  { level: 'DEBUG', message: 'scheduler: job cleanup-temp finished in 1.2s' },
  { level: 'WARN', message: 'cache-layer: eviction rate rising, 1.8k keys/min' },
  { level: 'INFO', message: 'auth-service: user admin signed in' },
];

const MAX_LOG_LINES = 200;

@Component({
  selector: 'app-dashboard',
  imports: [DecimalPipe, ListComponent, ListItemComponent, TagComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly metrics: MetricTile[] = [
    { title: 'Active Users', value: '1,284', trend: { label: '+12%', positive: true }, subLabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', positive: true }, subLabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', positive: false }, subLabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', positive: true }, subLabel: 'last 30 days' },
  ];

  private readonly throughputRaw = [
    { day: 'Mon', value: 4210 },
    { day: 'Tue', value: 4630 },
    { day: 'Wed', value: 5120 },
    { day: 'Thu', value: 4880 },
    { day: 'Fri', value: 5390 },
    { day: 'Sat', value: 3020 },
    { day: 'Sun', value: 2740 },
  ];

  private readonly throughputMax = Math.max(...this.throughputRaw.map((d) => d.value));

  readonly throughput = this.throughputRaw.map((d) => ({
    ...d,
    percent: Math.round((d.value / this.throughputMax) * 100),
  }));

  readonly throughputStats = {
    peak: this.throughputMax,
    average: Math.round(this.throughputRaw.reduce((s, d) => s + d.value, 0) / this.throughputRaw.length),
  };

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

  private readonly logViewport = viewChild<ElementRef<HTMLElement>>('logViewport');
  private nextLogId = 0;
  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    // Seed a few lines so the viewer is not empty on first paint.
    const now = Date.now();
    this.logs.set([5, 4, 3, 2, 1].map((n) => this.createLine(new Date(now - n * 3000))));
    this.timer = setInterval(() => this.appendLine(), 3000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  levelClass(level: LogLevel): string {
    return `level--${level.toLowerCase()}`;
  }

  private appendLine(): void {
    const el = this.logViewport()?.nativeElement;
    const pinnedToBottom = !el || el.scrollHeight - el.scrollTop - el.clientHeight < 8;

    this.logs.update((lines) => [...lines, this.createLine(new Date())].slice(-MAX_LOG_LINES));

    if (el && pinnedToBottom) {
      queueMicrotask(() => requestAnimationFrame(() => (el.scrollTop = el.scrollHeight)));
    }
  }

  private createLine(at: Date): LogLine {
    const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
    return {
      id: this.nextLogId++,
      time: at.toISOString().slice(11, 19),
      level: template.level,
      message: template.message,
    };
  }
}
