import { DatePipe } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, afterRender, signal, viewChild } from '@angular/core';
import { ListComponent, ListItemComponent, TagComponent, TagVariant } from '@jablonowski/dsb-components';

interface Metric {
  title: string;
  value: string;
  trend?: { label: string; variant: TagVariant };
  caption?: string;
}

interface Service {
  name: string;
  online: boolean;
}

type LogLevel = 'INFO' | 'OK' | 'WARN' | 'ERROR';

interface LogLine {
  id: number;
  time: Date;
  level: LogLevel;
  source: string;
  message: string;
}

const LOG_TEMPLATES: Array<Omit<LogLine, 'id' | 'time'>> = [
  { level: 'INFO', source: 'api-gateway', message: 'GET /api/users 200 — 38 ms' },
  { level: 'OK', source: 'deploy', message: 'Production deployed from commit a3f92b1' },
  { level: 'INFO', source: 'auth', message: 'Token refreshed for session 7f2c…e91' },
  { level: 'WARN', source: 'cache', message: 'Hit ratio dropped to 82% (threshold 85%)' },
  { level: 'INFO', source: 'storage', message: 'Snapshot vol-0a1b completed in 4.2 s' },
  { level: 'ERROR', source: 'analytics', message: 'Worker heartbeat missed — engine offline' },
  { level: 'INFO', source: 'api-gateway', message: 'POST /api/events 202 — 51 ms' },
  { level: 'OK', source: 'health', message: 'All probes passed (5/5 regions)' },
  { level: 'WARN', source: 'api-gateway', message: 'Latency spike: 420 ms (threshold 300 ms)' },
  { level: 'INFO', source: 'scheduler', message: 'Job nightly-report queued (#4821)' },
];

const MAX_LOG_LINES = 200;

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, TagComponent, ListComponent, ListItemComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly metrics: Metric[] = [
    { title: 'Active Users', value: '1,284', trend: { label: '+12%', variant: 'success' }, caption: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', variant: 'success' }, caption: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', variant: 'danger' }, caption: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', variant: 'success' }, caption: 'last 30 days' },
  ];

  readonly throughput = [
    { day: 'Mon', requests: 6_240 },
    { day: 'Tue', requests: 7_180 },
    { day: 'Wed', requests: 6_890 },
    { day: 'Thu', requests: 7_920 },
    { day: 'Fri', requests: 8_310 },
    { day: 'Sat', requests: 4_870 },
    { day: 'Sun', requests: 4_120 },
  ];
  private readonly peak = Math.max(...this.throughput.map((d) => d.requests));
  readonly bars = this.throughput.map((d) => ({ ...d, percent: Math.round((d.requests / this.peak) * 100) }));

  readonly services: Service[] = [
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

  readonly lastUpdated = signal(new Date());
  readonly logs = signal<LogLine[]>([]);

  private readonly logViewport = viewChild<ElementRef<HTMLElement>>('logViewport');
  private nextLogId = 0;
  private timer?: ReturnType<typeof setInterval>;
  private stickToBottom = true;

  constructor() {
    // Follow the tail like a terminal, unless the reader has scrolled up to look at history.
    afterRender(() => {
      const el = this.logViewport()?.nativeElement;
      if (el && this.stickToBottom) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }

  ngOnInit(): void {
    const now = Date.now();
    const seed = Array.from({ length: 8 }, (_, i) => this.makeLog(new Date(now - (8 - i) * 3000)));
    this.logs.set(seed);
    this.timer = setInterval(() => {
      const time = new Date();
      this.lastUpdated.set(time);
      this.logs.update((lines) => [...lines, this.makeLog(time)].slice(-MAX_LOG_LINES));
    }, 3000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  onLogScroll(el: HTMLElement): void {
    this.stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
  }

  private makeLog(time: Date): LogLine {
    const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
    return { id: this.nextLogId++, time, ...template };
  }
}
