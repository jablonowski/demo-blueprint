import { Component, ElementRef, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { BadgeComponent, BadgeTone } from '../../shared/badge.component';

interface Metric {
  title: string;
  value: string;
  trend?: string;
  trendTone?: BadgeTone;
  subLabel?: string;
}

interface LogLine {
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

const LOG_MESSAGES: Omit<LogLine, 'time'>[] = [
  { level: 'INFO', message: 'GET /api/users 200 — 38ms' },
  { level: 'INFO', message: 'auth-service: token refreshed for session a91f' },
  { level: 'INFO', message: 'cache-layer: hit ratio 94.2%' },
  { level: 'WARN', message: 'analytics-engine: heartbeat missed (retry 1/3)' },
  { level: 'INFO', message: 'POST /api/events 201 — 112ms' },
  { level: 'INFO', message: 'storage-service: snapshot completed' },
  { level: 'ERROR', message: 'analytics-engine: connection refused on :9200' },
  { level: 'INFO', message: 'api-gateway: 4,820 req/min' },
];

const MAX_LOG_LINES = 100;
const LOG_INTERVAL_MS = 3000;

@Component({
  selector: 'app-dashboard',
  imports: [BadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly logViewport = viewChild<ElementRef<HTMLElement>>('logViewport');
  private timer?: ReturnType<typeof setInterval>;
  private logCursor = 0;

  protected readonly metrics: Metric[] = [
    { title: 'Active Users', value: '1,284', trend: '+12%', trendTone: 'success', subLabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: '-8ms', trendTone: 'success', subLabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: '+0.01%', trendTone: 'danger', subLabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: 'Stable', trendTone: 'success', subLabel: 'last 30 days' },
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

  ngOnInit(): void {
    for (let i = 0; i < 6; i++) {
      this.appendLog();
    }
    this.timer = setInterval(() => this.appendLog(), LOG_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  private appendLog(): void {
    const entry = LOG_MESSAGES[this.logCursor++ % LOG_MESSAGES.length];
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    this.logs.update((lines) => [...lines, { time, ...entry }].slice(-MAX_LOG_LINES));
    queueMicrotask(() => {
      const el = this.logViewport()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
