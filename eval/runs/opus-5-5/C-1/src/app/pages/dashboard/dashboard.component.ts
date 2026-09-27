import { AfterViewChecked, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ListComponent, ListItemComponent, TagComponent, TagVariant } from '@jablonowski/dsb-components';

interface Metric {
  title: string;
  value: string;
  trend?: { label: string; variant: TagVariant };
  sub?: string;
}

interface LogLine {
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
}

const LOG_TEMPLATES: Omit<LogLine, 'time'>[] = [
  { level: 'INFO', message: 'api-gateway: GET /api/users 200 (38 ms)' },
  { level: 'INFO', message: 'auth-service: token refreshed for session a3f92b1' },
  { level: 'DEBUG', message: 'cache-layer: hit ratio 94.2% over last 60 s' },
  { level: 'WARN', message: 'analytics-engine: heartbeat missed, retrying (attempt 2/5)' },
  { level: 'INFO', message: 'storage-service: snapshot completed in 1.4 s' },
  { level: 'ERROR', message: 'analytics-engine: connection refused on :9092' },
  { level: 'INFO', message: 'api-gateway: POST /api/users 201 (52 ms)' },
  { level: 'DEBUG', message: 'scheduler: 12 jobs queued, 0 failed' },
  { level: 'INFO', message: 'auth-service: user admin signed in' },
  { level: 'WARN', message: 'api-gateway: p95 latency 310 ms above 300 ms threshold' },
];

const MAX_LOG_LINES = 200;

@Component({
  selector: 'app-dashboard',
  imports: [TagComponent, ListComponent, ListItemComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements AfterViewChecked {
  private readonly logViewport = viewChild<ElementRef<HTMLElement>>('logViewport');
  private stickToBottom = true;
  private templateIndex = 0;

  readonly lastUpdated = new Date().toLocaleString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  readonly metrics: Metric[] = [
    { title: 'Active Users', value: '1,284', trend: { label: '+12%', variant: 'success' }, sub: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', variant: 'success' }, sub: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', variant: 'danger' }, sub: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', variant: 'success' }, sub: 'last 30 days' },
  ];

  private readonly throughputRaw = [
    { day: 'Mon', value: 3920 },
    { day: 'Tue', value: 4480 },
    { day: 'Wed', value: 4820 },
    { day: 'Thu', value: 4310 },
    { day: 'Fri', value: 4650 },
    { day: 'Sat', value: 2740 },
    { day: 'Sun', value: 2210 },
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

  readonly summary = [
    { label: 'Requests/min', value: '4,820' },
    { label: 'Avg Response', value: '142 ms' },
    { label: 'Error Rate', value: '0.04%' },
    { label: 'Uptime (30d)', value: '99.97%' },
  ];

  readonly logs = signal<LogLine[]>(this.seedLogs());

  constructor() {
    const timer = setInterval(() => this.appendLog(), 3000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  ngAfterViewChecked(): void {
    const el = this.logViewport()?.nativeElement;
    if (el && this.stickToBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }

  onLogScroll(el: HTMLElement): void {
    this.stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < el.clientHeight / 4;
  }

  private seedLogs(): LogLine[] {
    const now = Date.now();
    return Array.from({ length: 8 }, (_, i) => this.nextLog(new Date(now - (8 - i) * 3000)));
  }

  private appendLog(): void {
    this.logs.update((lines) => [...lines, this.nextLog(new Date())].slice(-MAX_LOG_LINES));
  }

  private nextLog(at: Date): LogLine {
    const template = LOG_TEMPLATES[this.templateIndex % LOG_TEMPLATES.length];
    this.templateIndex++;
    return { ...template, time: at.toTimeString().slice(0, 8) };
  }
}
