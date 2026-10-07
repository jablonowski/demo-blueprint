import { Component, ElementRef, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';

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
  source: string;
  message: string;
}

const LOG_TEMPLATES: Omit<LogLine, 'time'>[] = [
  { level: 'INFO', source: 'api-gateway', message: 'GET /api/users 200 — 38 ms' },
  { level: 'INFO', source: 'auth', message: 'Token refreshed for session 7f3a…c21' },
  { level: 'INFO', source: 'storage', message: 'Snapshot completed (2.4 GB) in 11.2 s' },
  { level: 'WARN', source: 'cache', message: 'Eviction rate above 5% on node cache-02' },
  { level: 'ERROR', source: 'analytics', message: 'Worker heartbeat missed — retrying (3/5)' },
  { level: 'INFO', source: 'api-gateway', message: 'POST /api/events 202 — 64 ms' },
  { level: 'INFO', source: 'deploy', message: 'Production deployed from commit a3f92b1' },
  { level: 'WARN', source: 'api-gateway', message: 'Latency spike detected: 420 ms (threshold 300 ms)' },
  { level: 'INFO', source: 'auth', message: 'User admin signed in from 10.0.4.17' },
  { level: 'ERROR', source: 'analytics', message: 'Connection refused — analytics-db:5432' },
];

@Component({
  selector: 'app-dashboard',
  imports: [DecimalPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private logViewport = viewChild.required<ElementRef<HTMLElement>>('logViewport');
  private timer?: ReturnType<typeof setInterval>;
  private cursor = 0;

  readonly lastUpdated = new Date();

  readonly metrics: Metric[] = [
    { title: 'Active Users', value: '1,284', trend: { label: '+12%', tone: 'success' }, sub: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', tone: 'success' }, sub: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', tone: 'danger' }, sub: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', tone: 'success' }, sub: 'last 30 days' },
  ];

  readonly throughput = [
    { day: 'Mon', value: 4120 },
    { day: 'Tue', value: 4680 },
    { day: 'Wed', value: 5240 },
    { day: 'Thu', value: 4910 },
    { day: 'Fri', value: 5630 },
    { day: 'Sat', value: 3380 },
    { day: 'Sun', value: 2970 },
  ];
  readonly maxThroughput = Math.max(...this.throughput.map((d) => d.value));
  readonly bars = this.throughput.map((d) => ({ ...d, pct: Math.round((d.value / this.maxThroughput) * 100) }));
  readonly avgThroughput = Math.round(this.throughput.reduce((s, d) => s + d.value, 0) / this.throughput.length);

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

  ngOnInit(): void {
    const start = Date.now() - 8 * 3000;
    this.logs.set(Array.from({ length: 8 }, (_, i) => this.nextLog(new Date(start + i * 3000))));
    this.timer = setInterval(() => {
      this.logs.update((l) => [...l, this.nextLog(new Date())].slice(-200));
      queueMicrotask(() => this.scrollToBottom());
    }, 3000);
    queueMicrotask(() => this.scrollToBottom());
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  private nextLog(date: Date): LogLine {
    const t = LOG_TEMPLATES[this.cursor++ % LOG_TEMPLATES.length];
    return { ...t, time: date.toTimeString().slice(0, 8) };
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.logViewport().nativeElement;
      el.scrollTop = el.scrollHeight;
    });
  }
}
