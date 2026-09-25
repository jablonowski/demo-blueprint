import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { BadgeComponent, BadgeTone } from '../../shared/badge.component';

interface Metric {
  title: string;
  value: string;
  trend?: { label: string; tone: BadgeTone };
  subLabel?: string;
}

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogLine {
  id: number;
  time: string;
  level: LogLevel;
  source: string;
  message: string;
}

const LOG_TEMPLATES: Array<Omit<LogLine, 'id' | 'time'>> = [
  { level: 'INFO', source: 'api-gateway', message: 'GET /api/users 200 in 118ms' },
  { level: 'INFO', source: 'auth-service', message: 'Token refreshed for session 7f3a…c21' },
  { level: 'DEBUG', source: 'cache-layer', message: 'Cache hit ratio 94.2% (window 60s)' },
  { level: 'WARN', source: 'analytics-engine', message: 'Health check timed out after 5000ms' },
  { level: 'INFO', source: 'storage-service', message: 'Snapshot vol-0a91 completed (2.4 GB)' },
  { level: 'ERROR', source: 'analytics-engine', message: 'Connection refused: analytics.internal:9090' },
  { level: 'INFO', source: 'api-gateway', message: 'POST /api/events 202 in 64ms' },
  { level: 'DEBUG', source: 'scheduler', message: 'Job metrics-rollup queued (priority=low)' },
  { level: 'WARN', source: 'api-gateway', message: 'p95 latency 312ms exceeds 300ms threshold' },
  { level: 'INFO', source: 'auth-service', message: 'User admin signed in from 10.0.4.12' },
];

const MAX_LOG_LINES = 200;
const LOG_INTERVAL_MS = 3000;

@Component({
  selector: 'app-dashboard',
  imports: [BadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly logViewer = viewChild.required<ElementRef<HTMLElement>>('logViewer');
  private nextLogId = 0;
  private templateIndex = 0;

  protected readonly lastUpdated = new Date();

  protected readonly metrics: Metric[] = [
    { title: 'Active Users', value: '1,284', trend: { label: '+12%', tone: 'success' }, subLabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', tone: 'success' }, subLabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', tone: 'danger' }, subLabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', tone: 'success' }, subLabel: 'last 30 days' },
  ];

  private readonly throughputRaw = [
    { day: 'Mon', value: 3820 },
    { day: 'Tue', value: 4410 },
    { day: 'Wed', value: 5120 },
    { day: 'Thu', value: 4780 },
    { day: 'Fri', value: 5460 },
    { day: 'Sat', value: 2940 },
    { day: 'Sun', value: 2510 },
  ];
  private readonly throughputMax = Math.max(...this.throughputRaw.map((d) => d.value));
  protected readonly throughput = this.throughputRaw.map((d) => ({
    ...d,
    percent: Math.round((d.value / this.throughputMax) * 100),
  }));

  protected readonly services = [
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
    for (let i = 0; i < 8; i++) {
      this.appendLog(new Date(Date.now() - (8 - i) * LOG_INTERVAL_MS));
    }

    const timer = setInterval(() => this.appendLog(new Date()), LOG_INTERVAL_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));

    // Keep the newest line in view as the log grows.
    afterRenderEffect(() => {
      this.logs();
      const el = this.logViewer().nativeElement;
      el.scrollTop = el.scrollHeight;
    });
  }

  private appendLog(at: Date): void {
    const template = LOG_TEMPLATES[this.templateIndex++ % LOG_TEMPLATES.length];
    const line: LogLine = { id: this.nextLogId++, time: at.toISOString().slice(11, 19), ...template };
    this.logs.update((lines) => [...lines, line].slice(-MAX_LOG_LINES));
  }
}
