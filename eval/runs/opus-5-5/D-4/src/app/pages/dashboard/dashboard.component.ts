import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  signal,
} from '@angular/core';
import { ListComponent, ListItemComponent, TagComponent, TagVariant } from '@jablonowski/dsb-components';

interface Metric {
  title: string;
  value: string;
  trend?: { label: string; positive: boolean };
  subLabel?: string;
}

interface Service {
  name: string;
  online: boolean;
}

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface LogLine {
  id: number;
  time: string;
  level: LogLevel;
  message: string;
}

const LOG_TEMPLATES: { level: LogLevel; message: string }[] = [
  { level: 'INFO', message: 'GET /api/users 200 — 38 ms' },
  { level: 'INFO', message: 'auth-service: token refreshed for session 7f3a' },
  { level: 'INFO', message: 'cache-layer: hit ratio 94.2%' },
  { level: 'WARN', message: 'api-gateway: p95 latency 310 ms above 300 ms threshold' },
  { level: 'INFO', message: 'storage-service: snapshot completed in 1.4 s' },
  { level: 'ERROR', message: 'analytics-engine: connection refused (10.0.4.12:9000)' },
  { level: 'INFO', message: 'POST /api/events 202 — 12 ms' },
  { level: 'WARN', message: 'cache-layer: eviction rate rising (1.2k/min)' },
  { level: 'INFO', message: 'deploy: web@a3f92b1 healthy on 3/3 instances' },
];

const MAX_LOG_LINES = 200;

@Component({
  selector: 'app-dashboard',
  imports: [ListComponent, ListItemComponent, TagComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('logViewport') private logViewport?: ElementRef<HTMLElement>;

  readonly metrics: Metric[] = [
    { title: 'Active Users', value: '1,284', trend: { label: '+12%', positive: true }, subLabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', positive: true }, subLabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', positive: false }, subLabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', positive: true }, subLabel: 'last 30 days' },
  ];

  private readonly throughputRaw = [
    { day: 'Mon', value: 3820 },
    { day: 'Tue', value: 4410 },
    { day: 'Wed', value: 4980 },
    { day: 'Thu', value: 4620 },
    { day: 'Fri', value: 5240 },
    { day: 'Sat', value: 2960 },
    { day: 'Sun', value: 2580 },
  ];

  readonly throughput = (() => {
    const max = Math.max(...this.throughputRaw.map((d) => d.value));
    return this.throughputRaw.map((d) => ({ ...d, percent: Math.round((d.value / max) * 100) }));
  })();

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

  readonly logs = signal<LogLine[]>([]);

  private nextId = 0;
  private timer?: ReturnType<typeof setInterval>;
  private stickToBottom = true;

  ngOnInit(): void {
    const seed: LogLine[] = [];
    const now = Date.now();
    for (let i = 7; i > 0; i--) {
      seed.push(this.makeLine(new Date(now - i * 3000)));
    }
    this.logs.set(seed);
    this.timer = setInterval(() => {
      this.logs.update((lines) => [...lines, this.makeLine(new Date())].slice(-MAX_LOG_LINES));
    }, 3000);
  }

  ngAfterViewChecked(): void {
    const el = this.logViewport?.nativeElement;
    if (el && this.stickToBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  onLogScroll(): void {
    const el = this.logViewport?.nativeElement;
    if (!el) return;
    this.stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
  }

  trendVariant(metric: Metric): TagVariant {
    return metric.trend?.positive ? 'success' : 'danger';
  }

  levelClass(level: LogLevel): string {
    return `log-level--${level.toLowerCase()}`;
  }

  private makeLine(date: Date): LogLine {
    const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
    return {
      id: this.nextId++,
      time: date.toISOString().slice(11, 19),
      level: template.level,
      message: template.message,
    };
  }
}
