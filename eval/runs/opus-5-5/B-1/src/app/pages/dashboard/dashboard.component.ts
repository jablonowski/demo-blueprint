import { Component, DestroyRef, ElementRef, afterRender, inject, signal, viewChild } from '@angular/core';
import { TagComponent, TagVariant } from '@jablonowski/dsb-components';

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

type LogLevel = 'INFO' | 'OK' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogLine {
  id: number;
  time: string;
  level: LogLevel;
  message: string;
}

const LOG_TEMPLATES: ReadonlyArray<Omit<LogLine, 'id' | 'time'>> = [
  { level: 'OK', message: 'api-gateway: GET /api/users 200 (38 ms)' },
  { level: 'INFO', message: 'auth-service: token refreshed for session a3f92b1' },
  { level: 'OK', message: 'storage-service: snapshot completed (1.2 GB)' },
  { level: 'WARN', message: 'cache-layer: hit ratio dropped to 81%' },
  { level: 'ERROR', message: 'analytics-engine: health check failed, connection refused' },
  { level: 'INFO', message: 'api-gateway: POST /api/users 201 (54 ms)' },
  { level: 'DEBUG', message: 'scheduler: job cleanup-sessions queued' },
  { level: 'OK', message: 'deploy: production rollout finished (build 1482)' },
  { level: 'WARN', message: 'api-gateway: p95 latency 420 ms above 300 ms threshold' },
];

const MAX_LOG_LINES = 200;

@Component({
  selector: 'app-dashboard',
  imports: [TagComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  readonly lastUpdated = new Date().toLocaleString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  readonly metrics: MetricTile[] = [
    { title: 'Active Users', value: '1,284', trend: { label: '+12%', variant: 'success' }, subLabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', variant: 'success' }, subLabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', variant: 'danger' }, subLabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', variant: 'success' }, subLabel: 'last 30 days' },
  ];

  private readonly throughput: ThroughputBar[] = [
    { day: 'Mon', requests: 3920 },
    { day: 'Tue', requests: 4480 },
    { day: 'Wed', requests: 5130 },
    { day: 'Thu', requests: 4820 },
    { day: 'Fri', requests: 5610 },
    { day: 'Sat', requests: 3240 },
    { day: 'Sun', requests: 2870 },
  ];

  readonly bars = (() => {
    const max = Math.max(...this.throughput.map((b) => b.requests));
    return this.throughput.map((b) => ({ ...b, percent: Math.round((b.requests / max) * 100) }));
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
  private readonly logViewport = viewChild<ElementRef<HTMLElement>>('logViewport');
  private nextLogId = 0;
  private stickToBottom = true;

  constructor() {
    for (let i = 0; i < 6; i++) this.appendLog(new Date(Date.now() - (6 - i) * 3000));
    const timer = setInterval(() => this.appendLog(new Date()), 3000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));

    // Follow the tail unless the reader has scrolled up.
    afterRender(() => {
      const el = this.logViewport()?.nativeElement;
      if (el && this.stickToBottom) el.scrollTop = el.scrollHeight;
    });
  }

  onLogScroll(el: HTMLElement): void {
    this.stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
  }

  private appendLog(at: Date): void {
    const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
    const line: LogLine = { id: this.nextLogId++, time: at.toTimeString().slice(0, 8), ...template };
    this.logs.update((lines) => [...lines, line].slice(-MAX_LOG_LINES));
  }
}
