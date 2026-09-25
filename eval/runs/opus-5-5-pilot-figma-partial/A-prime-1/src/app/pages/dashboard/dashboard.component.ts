import { Component, DestroyRef, ElementRef, afterRenderEffect, inject, signal, viewChild } from '@angular/core';

interface Metric {
  title: string;
  value: string;
  trend: string;
  positive: boolean;
  subLabel: string;
}

interface LogLine {
  id: number;
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
}

const LOG_TEMPLATES: Pick<LogLine, 'level' | 'message'>[] = [
  { level: 'INFO', message: 'api-gateway: GET /api/users 200 (38ms)' },
  { level: 'INFO', message: 'auth-service: token refreshed for session a3f9c1' },
  { level: 'DEBUG', message: 'cache-layer: hit ratio 94.2% over last 60s' },
  { level: 'INFO', message: 'storage-service: snapshot completed (2.4 GB)' },
  { level: 'WARN', message: 'analytics-engine: heartbeat missed, retrying (attempt 2/5)' },
  { level: 'INFO', message: 'api-gateway: POST /api/events 202 (12ms)' },
  { level: 'ERROR', message: 'analytics-engine: connection refused on :9090' },
  { level: 'INFO', message: 'scheduler: job metrics-rollup finished in 1.8s' },
  { level: 'DEBUG', message: 'auth-service: 128 active sessions' },
  { level: 'INFO', message: 'api-gateway: PUT /api/users/2 200 (41ms)' },
];

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private logViewport = viewChild<ElementRef<HTMLElement>>('logViewport');

  readonly metrics: Metric[] = [
    { title: 'Active Users', value: '1,284', trend: '+12%', positive: true, subLabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: '-8ms', positive: true, subLabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: '+0.01%', positive: false, subLabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: 'Stable', positive: true, subLabel: 'last 30 days' },
  ];

  private readonly throughputRaw = [
    { day: 'Mon', value: 3200 },
    { day: 'Tue', value: 4100 },
    { day: 'Wed', value: 3800 },
    { day: 'Thu', value: 4820 },
    { day: 'Fri', value: 4400 },
    { day: 'Sat', value: 2300 },
    { day: 'Sun', value: 1900 },
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

  private nextId = 0;
  logs = signal<LogLine[]>(Array.from({ length: 8 }, (_, i) => this.makeLog(i, 8 - i)));

  constructor() {
    const timer = setInterval(() => {
      this.logs.update((lines) => [...lines, this.makeLog(this.nextId)].slice(-200));
    }, 3000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));

    afterRenderEffect(() => {
      this.logs();
      const el = this.logViewport()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  private makeLog(seed: number, secondsAgoInSteps = 0): LogLine {
    const template = LOG_TEMPLATES[seed % LOG_TEMPLATES.length];
    const time = new Date(Date.now() - secondsAgoInSteps * 3000);
    return { id: this.nextId++, time: time.toTimeString().slice(0, 8), ...template };
  }
}
