import { Component, DestroyRef, ElementRef, afterRender, inject, signal, viewChild } from '@angular/core';
import { ListComponent, ListItemComponent, TagComponent, TagVariant } from '@jablonowski/dsb-components';

interface MetricTile {
  title: string;
  value: string;
  trend?: { label: string; positive: boolean };
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

interface LogLine {
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

const LOG_TEMPLATES: Omit<LogLine, 'time'>[] = [
  { level: 'INFO', message: 'api-gateway: GET /api/users 200 (38ms)' },
  { level: 'INFO', message: 'auth-service: token refreshed for session a91f' },
  { level: 'INFO', message: 'storage-service: snapshot completed (2.4 GB)' },
  { level: 'WARN', message: 'cache-layer: eviction rate above 5% threshold' },
  { level: 'INFO', message: 'api-gateway: POST /api/events 202 (61ms)' },
  { level: 'ERROR', message: 'analytics-engine: worker heartbeat missed, retrying' },
  { level: 'INFO', message: 'scheduler: job metrics-rollup finished in 1.2s' },
  { level: 'WARN', message: 'api-gateway: p95 latency 212ms on /api/search' },
];

const MAX_LOG_LINES = 200;

@Component({
  selector: 'app-dashboard',
  imports: [TagComponent, ListComponent, ListItemComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  readonly metrics: MetricTile[] = [
    { title: 'Active Users', value: '1,284', trend: { label: '+12%', positive: true }, subLabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', positive: true }, subLabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', positive: false }, subLabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', positive: true }, subLabel: 'last 30 days' },
  ];

  private readonly throughput: ThroughputBar[] = [
    { day: 'Mon', requests: 3120 },
    { day: 'Tue', requests: 4280 },
    { day: 'Wed', requests: 3860 },
    { day: 'Thu', requests: 4820 },
    { day: 'Fri', requests: 4410 },
    { day: 'Sat', requests: 2240 },
    { day: 'Sun', requests: 1980 },
  ];

  private readonly maxRequests = Math.max(...this.throughput.map((b) => b.requests));

  readonly bars = this.throughput.map((b) => ({
    ...b,
    percent: Math.round((b.requests / this.maxRequests) * 100),
  }));

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
  private logCursor = 0;
  private stickToBottom = true;

  constructor() {
    for (let i = 0; i < 6; i++) this.appendLog();

    const timer = setInterval(() => this.appendLog(), 3000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));

    afterRender(() => {
      const el = this.logViewport()?.nativeElement;
      if (el && this.stickToBottom) el.scrollTop = el.scrollHeight;
    });
  }

  trendVariant(tile: MetricTile): TagVariant {
    return tile.trend?.positive ? 'success' : 'danger';
  }

  onLogScroll(el: HTMLElement): void {
    this.stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
  }

  private appendLog(): void {
    const template = LOG_TEMPLATES[this.logCursor++ % LOG_TEMPLATES.length];
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    this.logs.update((lines) => [...lines, { ...template, time }].slice(-MAX_LOG_LINES));
  }
}
