import { Component, DestroyRef, ElementRef, afterRenderEffect, inject, signal, viewChild } from '@angular/core';
import { DatePipe, DecimalPipe, LowerCasePipe } from '@angular/common';
import { ListComponent, ListItemComponent, TagComponent, TagVariant } from '@jablonowski/dsb-components';

interface Metric {
  title: string;
  value: string;
  trend?: { label: string; positive: boolean };
  subLabel?: string;
}

interface ThroughputDay {
  day: string;
  requests: number;
}

interface Service {
  name: string;
  online: boolean;
}

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogLine {
  time: Date;
  level: LogLevel;
  source: string;
  message: string;
}

const LOG_TEMPLATES: Array<Omit<LogLine, 'time'>> = [
  { level: 'INFO', source: 'api-gateway', message: 'GET /api/users 200 in 38ms' },
  { level: 'INFO', source: 'auth-service', message: 'Token refreshed for session 7f3a…' },
  { level: 'DEBUG', source: 'cache-layer', message: 'Cache hit ratio 94.2% (window 60s)' },
  { level: 'WARN', source: 'analytics', message: 'Heartbeat missed, retrying in 5s' },
  { level: 'INFO', source: 'storage', message: 'Snapshot vol-02 completed (1.8 GB)' },
  { level: 'ERROR', source: 'analytics', message: 'Connection refused: analytics-engine:9200' },
  { level: 'INFO', source: 'api-gateway', message: 'POST /api/users 201 in 112ms' },
  { level: 'DEBUG', source: 'scheduler', message: 'Job metrics-rollup queued (id 4821)' },
  { level: 'INFO', source: 'auth-service', message: 'User admin signed in from 10.0.4.12' },
  { level: 'WARN', source: 'api-gateway', message: 'p95 latency 310ms above 300ms threshold' },
];

const MAX_LOG_LINES = 200;

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, DecimalPipe, LowerCasePipe, TagComponent, ListComponent, ListItemComponent],
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

  readonly throughput: ThroughputDay[] = [
    { day: 'Mon', requests: 5840 },
    { day: 'Tue', requests: 6420 },
    { day: 'Wed', requests: 7150 },
    { day: 'Thu', requests: 6890 },
    { day: 'Fri', requests: 7680 },
    { day: 'Sat', requests: 4210 },
    { day: 'Sun', requests: 3760 },
  ];

  private readonly maxRequests = Math.max(...this.throughput.map((d) => d.requests));
  readonly peakRequests = this.maxRequests;
  readonly averageRequests = Math.round(
    this.throughput.reduce((sum, d) => sum + d.requests, 0) / this.throughput.length,
  );
  readonly totalRequests = this.throughput.reduce((sum, d) => sum + d.requests, 0);

  readonly services: Service[] = [
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

  readonly logs = signal<LogLine[]>(this.seedLogs());
  private readonly logViewport = viewChild<ElementRef<HTMLElement>>('logViewport');
  private nextTemplate = 0;

  constructor() {
    const timer = setInterval(() => this.appendLog(), 3000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));

    // Keep the newest line in view, unless the user has scrolled up to read.
    let pinned = true;
    afterRenderEffect(() => {
      this.logs();
      const el = this.logViewport()?.nativeElement;
      if (!el) return;
      if (pinned) el.scrollTop = el.scrollHeight;
      el.onscroll = () => (pinned = el.scrollHeight - el.scrollTop - el.clientHeight < 8);
    });
  }

  barHeight(requests: number): number {
    return Math.round((requests / this.maxRequests) * 100);
  }

  trendVariant(metric: Metric): TagVariant {
    return metric.trend?.positive ? 'success' : 'danger';
  }

  private seedLogs(): LogLine[] {
    const now = Date.now();
    return LOG_TEMPLATES.slice(0, 6).map((t, i) => ({ ...t, time: new Date(now - (6 - i) * 3000) }));
  }

  private appendLog(): void {
    const template = LOG_TEMPLATES[this.nextTemplate++ % LOG_TEMPLATES.length];
    this.logs.update((lines) => [...lines, { ...template, time: new Date() }].slice(-MAX_LOG_LINES));
  }
}
