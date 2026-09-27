import { Component, DestroyRef, ElementRef, afterRenderEffect, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'default';
type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface Metric {
  title: string;
  value: string;
  trend?: { label: string; tone: Tone };
  subLabel?: string;
}

interface LogLine {
  id: number;
  time: Date;
  level: LogLevel;
  source: string;
  message: string;
}

const LOG_TEMPLATES: Array<Omit<LogLine, 'id' | 'time'>> = [
  { level: 'INFO', source: 'api-gateway', message: 'GET /api/users 200 in 38ms' },
  { level: 'INFO', source: 'auth-service', message: 'Token refreshed for session a3f92b1' },
  { level: 'DEBUG', source: 'cache-layer', message: 'Cache hit ratio 94.2% (window 60s)' },
  { level: 'WARN', source: 'analytics-engine', message: 'Health check timed out after 5000ms' },
  { level: 'INFO', source: 'storage-service', message: 'Snapshot completed: 2.4 GB in 41s' },
  { level: 'ERROR', source: 'analytics-engine', message: 'Connection refused: analytics.internal:9000' },
  { level: 'INFO', source: 'api-gateway', message: 'POST /api/users 201 in 112ms' },
  { level: 'DEBUG', source: 'auth-service', message: 'JWKS keys rotated, 2 active' },
  { level: 'WARN', source: 'api-gateway', message: 'Latency spike detected: 420ms (threshold 300ms)' },
  { level: 'INFO', source: 'cache-layer', message: 'Evicted 1,204 stale keys' },
];

const MAX_LOG_LINES = 200;

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private readonly logViewport = viewChild.required<ElementRef<HTMLElement>>('logViewport');
  private nextLogId = 0;

  readonly lastUpdated = new Date();

  readonly metrics: Metric[] = [
    { title: 'Active Users', value: '1,284', trend: { label: '+12%', tone: 'success' }, subLabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', tone: 'success' }, subLabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', tone: 'warning' }, subLabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', tone: 'success' }, subLabel: 'last 30 days' },
  ];

  readonly throughput = (() => {
    const days = [
      { day: 'Mon', value: 4210 },
      { day: 'Tue', value: 5380 },
      { day: 'Wed', value: 6120 },
      { day: 'Thu', value: 5640 },
      { day: 'Fri', value: 6890 },
      { day: 'Sat', value: 3420 },
      { day: 'Sun', value: 2980 },
    ];
    const max = Math.max(...days.map((d) => d.value));
    return days.map((d) => ({ ...d, percent: Math.round((d.value / max) * 100) }));
  })();

  readonly services: Array<{ name: string; online: boolean }> = [
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

  constructor() {
    const now = Date.now();
    for (let i = 7; i > 0; i--) {
      this.appendLog(new Date(now - i * 3000));
    }

    const timer = setInterval(() => this.appendLog(new Date()), 3000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));

    // Keep the newest line in view as lines are appended.
    afterRenderEffect(() => {
      this.logs();
      const el = this.logViewport().nativeElement;
      el.scrollTop = el.scrollHeight;
    });
  }

  levelTone(level: LogLevel): Tone {
    return level === 'ERROR' ? 'danger' : level === 'WARN' ? 'warning' : level === 'DEBUG' ? 'default' : 'info';
  }

  private appendLog(time: Date): void {
    const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
    const line: LogLine = { id: this.nextLogId++, time, ...template };
    this.logs.update((lines) => [...lines, line].slice(-MAX_LOG_LINES));
  }
}
