import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { BadgeComponent, BadgeTone } from '../../shared/badge.component';

interface MetricTile {
  title: string;
  value: string;
  trend?: { label: string; tone: BadgeTone };
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
  source: string;
  message: string;
}

const LOG_TEMPLATES: ReadonlyArray<Omit<LogLine, 'id' | 'time'>> = [
  { level: 'INFO', source: 'api-gateway', message: 'GET /api/users 200 — 38 ms' },
  { level: 'INFO', source: 'auth-service', message: 'Token refreshed for session 7f3a…c21' },
  { level: 'DEBUG', source: 'cache-layer', message: 'Cache hit ratio 94.2% (window 60s)' },
  { level: 'WARN', source: 'storage', message: 'Bucket "media" at 81% of quota' },
  { level: 'INFO', source: 'api-gateway', message: 'POST /api/events 201 — 54 ms' },
  { level: 'ERROR', source: 'analytics', message: 'Connection refused: analytics-engine:9042' },
  { level: 'INFO', source: 'scheduler', message: 'Job "nightly-report" queued' },
  { level: 'WARN', source: 'api-gateway', message: 'Latency spike: p95 420 ms (threshold 300 ms)' },
  { level: 'INFO', source: 'deploy', message: 'Production deployed from commit a3f92b1' },
  { level: 'DEBUG', source: 'auth-service', message: 'JWKS keys rotated, 2 active' },
];

const LOG_INTERVAL_MS = 3000;
const LOG_HISTORY_LIMIT = 200;

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements AfterViewChecked {
  private readonly logViewport = viewChild.required<ElementRef<HTMLElement>>('logViewport');
  private logSeq = 0;
  private stickToBottom = true;

  protected readonly lastUpdated = new Date();

  protected readonly metrics: MetricTile[] = [
    { title: 'Active Users', value: '1,284', trend: { label: '+12%', tone: 'success' }, subLabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', tone: 'success' }, subLabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', tone: 'danger' }, subLabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', tone: 'success' }, subLabel: 'last 30 days' },
  ];

  protected readonly throughput = [
    { day: 'Mon', value: 3920 },
    { day: 'Tue', value: 4480 },
    { day: 'Wed', value: 5210 },
    { day: 'Thu', value: 4820 },
    { day: 'Fri', value: 5630 },
    { day: 'Sat', value: 3150 },
    { day: 'Sun', value: 2740 },
  ];

  protected readonly bars = computed(() => {
    const max = Math.max(...this.throughput.map((d) => d.value));
    return this.throughput.map((d) => ({ ...d, percent: (d.value / max) * 100 }));
  });

  protected readonly services: ServiceStatus[] = [
    { name: 'API Gateway', online: true },
    { name: 'Auth Service', online: true },
    { name: 'Storage Service', online: true },
    { name: 'Analytics Engine', online: false },
    { name: 'Cache Layer', online: true },
  ];

  protected readonly summary = [
    { label: 'Requests/min', value: '4,820' },
    { label: 'Avg Response', value: '142 ms' },
    { label: 'Error Rate', value: '0.04%' },
    { label: 'Uptime (30d)', value: '99.97%' },
  ];

  protected readonly logs = signal<LogLine[]>([]);

  constructor() {
    for (let i = 0; i < 6; i++) {
      this.appendLog(new Date(Date.now() - (6 - i) * LOG_INTERVAL_MS));
    }
    const timer = setInterval(() => this.appendLog(new Date()), LOG_INTERVAL_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  ngAfterViewChecked(): void {
    if (this.stickToBottom) {
      const el = this.logViewport().nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  /** Only auto-follow new lines while the user is already at the bottom. */
  protected onLogScroll(): void {
    const el = this.logViewport().nativeElement;
    this.stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 4;
  }

  private appendLog(at: Date): void {
    const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
    const line: LogLine = { id: ++this.logSeq, time: at.toISOString().slice(11, 19), ...template };
    this.logs.update((lines) => [...lines, line].slice(-LOG_HISTORY_LIMIT));
  }
}
