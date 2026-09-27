import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';

type Tone = 'success' | 'danger';

interface Metric {
  title: string;
  value: string;
  trend?: { label: string; tone: Tone };
  sub?: string;
}

interface LogLine {
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

const LEVEL_TAG: Record<LogLine['level'], string> = {
  INFO: 'tag-info',
  WARN: 'tag-warning',
  ERROR: 'tag-danger',
};

const FAKE_LOGS: Omit<LogLine, 'time'>[] = [
  { level: 'INFO', message: 'GET /api/users 200 — 38ms' },
  { level: 'INFO', message: 'auth-service: token refreshed for session 8f2c' },
  { level: 'WARN', message: 'cache-layer: hit ratio dropped to 81%' },
  { level: 'INFO', message: 'api-gateway: health check passed' },
  { level: 'ERROR', message: 'analytics-engine: connection refused (10.0.4.12:9000)' },
  { level: 'INFO', message: 'storage-service: snapshot completed in 1.4s' },
  { level: 'INFO', message: 'POST /api/events 202 — 12ms' },
  { level: 'WARN', message: 'api-gateway: p95 latency 310ms above threshold' },
  { level: 'INFO', message: 'deploy: production rollout 42/42 pods ready' },
];

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  readonly levelTag = LEVEL_TAG;
  readonly updated = new Date().toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  readonly metrics: Metric[] = [
    { title: 'Active Users', value: '1,284', trend: { label: '+12%', tone: 'success' }, sub: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', tone: 'success' }, sub: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', tone: 'danger' }, sub: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', tone: 'success' }, sub: 'last 30 days' },
  ];

  private readonly throughputRaw = [
    { day: 'Mon', value: 4210 },
    { day: 'Tue', value: 4630 },
    { day: 'Wed', value: 5120 },
    { day: 'Thu', value: 4890 },
    { day: 'Fri', value: 5480 },
    { day: 'Sat', value: 3150 },
    { day: 'Sun', value: 2870 },
  ];
  private readonly throughputMax = Math.max(...this.throughputRaw.map((d) => d.value));
  readonly throughput = this.throughputRaw.map((d) => ({
    ...d,
    pct: Math.round((d.value / this.throughputMax) * 100),
  }));

  readonly services = [
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

  logs = signal<LogLine[]>([]);
  private logView = viewChild<ElementRef<HTMLElement>>('logView');
  private cursor = 0;

  constructor() {
    for (let i = 0; i < 6; i++) this.appendLog(new Date(Date.now() - (6 - i) * 3000));
    const timer = setInterval(() => this.appendLog(new Date()), 3000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  private appendLog(at: Date) {
    const entry = FAKE_LOGS[this.cursor++ % FAKE_LOGS.length];
    const time = at.toLocaleTimeString('en-GB', { hour12: false });
    this.logs.update((l) => [...l.slice(-199), { ...entry, time }]);
    // Keep the newest line in view after it renders.
    setTimeout(() => {
      const el = this.logView()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
