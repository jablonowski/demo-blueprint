import { Component, ElementRef, OnDestroy, OnInit, afterRenderEffect, signal, viewChild } from '@angular/core';

interface Metric {
  title: string;
  value: string;
  trend?: string;
  positive?: boolean;
  subLabel?: string;
}

interface LogLine {
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
}

const LOG_TEMPLATES: Omit<LogLine, 'time'>[] = [
  { level: 'INFO', message: 'api-gateway: GET /api/users 200 (38ms)' },
  { level: 'INFO', message: 'auth-service: token refreshed for session 8f2c' },
  { level: 'DEBUG', message: 'cache-layer: hit ratio 94.2% over last 60s' },
  { level: 'INFO', message: 'storage-service: snapshot completed (1.2 GB)' },
  { level: 'WARN', message: 'api-gateway: p95 latency above 250ms threshold' },
  { level: 'ERROR', message: 'analytics-engine: health check failed (connection refused)' },
  { level: 'INFO', message: 'api-gateway: POST /api/events 202 (12ms)' },
  { level: 'DEBUG', message: 'scheduler: job cleanup-sessions queued' },
  { level: 'WARN', message: 'auth-service: 3 failed login attempts from 10.0.4.17' },
  { level: 'INFO', message: 'cache-layer: evicted 128 stale keys' },
];

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly logViewport = viewChild.required<ElementRef<HTMLElement>>('logViewport');
  private timer?: ReturnType<typeof setInterval>;
  private cursor = 0;

  readonly metrics: Metric[] = [
    { title: 'Active Users', value: '1,284', trend: '+12%', positive: true, subLabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: '-8ms', positive: true, subLabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: '+0.01%', positive: false, subLabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: 'Stable', positive: true, subLabel: 'last 30 days' },
  ];

  private readonly throughputRaw = [
    { day: 'Mon', value: 3820 },
    { day: 'Tue', value: 4510 },
    { day: 'Wed', value: 4180 },
    { day: 'Thu', value: 4960 },
    { day: 'Fri', value: 5240 },
    { day: 'Sat', value: 2870 },
    { day: 'Sun', value: 2340 },
  ];

  private readonly throughputMax = Math.max(...this.throughputRaw.map((d) => d.value));

  readonly throughput = this.throughputRaw.map((d) => ({
    ...d,
    percent: Math.round((d.value / this.throughputMax) * 100),
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

  readonly logs = signal<LogLine[]>([]);

  constructor() {
    // Keep the newest line in view as the log grows.
    afterRenderEffect(() => {
      this.logs();
      const el = this.logViewport().nativeElement;
      el.scrollTop = el.scrollHeight;
    });
  }

  ngOnInit(): void {
    for (let i = 0; i < 6; i++) this.appendLog();
    this.timer = setInterval(() => this.appendLog(), 3000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  private appendLog(): void {
    const template = LOG_TEMPLATES[this.cursor++ % LOG_TEMPLATES.length];
    const time = new Date().toTimeString().slice(0, 8);
    this.logs.update((lines) => [...lines, { time, ...template }].slice(-200));
  }
}
