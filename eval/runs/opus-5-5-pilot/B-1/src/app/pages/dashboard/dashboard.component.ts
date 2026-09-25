import { AfterViewChecked, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ListComponent, ListItemComponent, TagComponent, TagVariant } from '@jablonowski/dsb-components';

interface Metric {
  title: string;
  value: string;
  trend?: string;
  trendVariant?: TagVariant;
  subLabel?: string;
}

interface LogLine {
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
}

const LOG_TEMPLATES: Omit<LogLine, 'time'>[] = [
  { level: 'INFO', message: 'api-gateway: GET /api/users 200 in 38ms' },
  { level: 'INFO', message: 'auth-service: token refreshed for session 7f3a' },
  { level: 'DEBUG', message: 'cache-layer: hit ratio 94.2% over last 60s' },
  { level: 'WARN', message: 'analytics-engine: heartbeat missed, retrying (2/5)' },
  { level: 'INFO', message: 'storage-service: snapshot completed (1.2 GB)' },
  { level: 'ERROR', message: 'analytics-engine: connection refused on :9090' },
  { level: 'INFO', message: 'api-gateway: POST /api/events 201 in 52ms' },
  { level: 'DEBUG', message: 'scheduler: job cleanup-tmp finished in 410ms' },
  { level: 'INFO', message: 'auth-service: login succeeded for admin' },
  { level: 'WARN', message: 'api-gateway: p95 latency 212ms above target' },
];

const MAX_LOG_LINES = 200;

@Component({
  selector: 'app-dashboard',
  imports: [TagComponent, ListComponent, ListItemComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements AfterViewChecked {
  readonly metrics: Metric[] = [
    { title: 'Active Users', value: '1,284', trend: '+12%', trendVariant: 'success', subLabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: '-8ms', trendVariant: 'success', subLabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: '+0.01%', trendVariant: 'danger', subLabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: 'Stable', trendVariant: 'success', subLabel: 'last 30 days' },
  ];

  private readonly throughputRaw = [
    { day: 'Mon', value: 3820 },
    { day: 'Tue', value: 4410 },
    { day: 'Wed', value: 4020 },
    { day: 'Thu', value: 4960 },
    { day: 'Fri', value: 5240 },
    { day: 'Sat', value: 2890 },
    { day: 'Sun', value: 2360 },
  ];
  private readonly throughputMax = Math.max(...this.throughputRaw.map((d) => d.value));
  readonly throughput = this.throughputRaw.map((d) => ({
    ...d,
    percent: Math.round((d.value / this.throughputMax) * 100),
  }));

  readonly services: { name: string; online: boolean }[] = [
    { name: 'API Gateway', online: true },
    { name: 'Auth Service', online: true },
    { name: 'Storage Service', online: true },
    { name: 'Analytics Engine', online: false },
    { name: 'Cache Layer', online: true },
  ];

  readonly summary: { label: string; value: string }[] = [
    { label: 'Requests/min', value: '4,820' },
    { label: 'Avg Response', value: '142 ms' },
    { label: 'Error Rate', value: '0.04%' },
    { label: 'Uptime (30d)', value: '99.97%' },
  ];

  readonly logs = signal<LogLine[]>([]);
  private readonly logViewport = viewChild<ElementRef<HTMLElement>>('logViewport');
  private logCursor = 0;
  private stickToBottom = true;
  private pendingScroll = false;

  constructor() {
    for (let i = 0; i < 6; i++) {
      this.appendLog(new Date(Date.now() - (6 - i) * 3000));
    }
    const timer = setInterval(() => this.appendLog(new Date()), 3000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  ngAfterViewChecked(): void {
    const el = this.logViewport()?.nativeElement;
    if (el && this.pendingScroll) {
      this.pendingScroll = false;
      el.scrollTop = el.scrollHeight;
    }
  }

  onLogScroll(el: HTMLElement): void {
    // Only follow new lines while the reader is at the bottom.
    this.stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
  }

  private appendLog(at: Date): void {
    const template = LOG_TEMPLATES[this.logCursor++ % LOG_TEMPLATES.length];
    const time = at.toTimeString().slice(0, 8);
    this.logs.update((lines) => [...lines, { time, ...template }].slice(-MAX_LOG_LINES));
    this.pendingScroll = this.stickToBottom;
  }
}
