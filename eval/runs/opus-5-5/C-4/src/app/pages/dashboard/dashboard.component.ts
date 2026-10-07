import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { ListComponent, ListItemComponent, TagComponent, TagVariant } from '@jablonowski/dsb-components';

interface MetricTile {
  title: string;
  value: string;
  trend?: { label: string; positive: boolean };
  subLabel?: string;
}

interface Service {
  name: string;
  online: boolean;
}

interface LogLine {
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

const LOG_TEMPLATES: Omit<LogLine, 'time'>[] = [
  { level: 'INFO', message: 'api-gateway: GET /api/users 200 (38ms)' },
  { level: 'INFO', message: 'auth-service: token refreshed for session 7f3a' },
  { level: 'INFO', message: 'storage: snapshot completed (2.4 GB)' },
  { level: 'WARN', message: 'cache-layer: hit ratio dropped to 81%' },
  { level: 'INFO', message: 'api-gateway: POST /api/events 201 (54ms)' },
  { level: 'ERROR', message: 'analytics-engine: connection refused on :9042' },
  { level: 'INFO', message: 'scheduler: job cleanup-sessions finished' },
  { level: 'WARN', message: 'api-gateway: p95 latency 312ms above threshold' },
];

@Component({
  selector: 'app-dashboard',
  imports: [ListComponent, ListItemComponent, TagComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('logViewport') private logViewport?: ElementRef<HTMLElement>;

  readonly metrics: MetricTile[] = [
    { title: 'Active Users', value: '1,284', trend: { label: '+12%', positive: true }, subLabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', positive: true }, subLabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', positive: false }, subLabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', positive: true }, subLabel: 'last 30 days' },
  ];

  private readonly throughputRaw = [
    { day: 'Mon', value: 4210 },
    { day: 'Tue', value: 4820 },
    { day: 'Wed', value: 5130 },
    { day: 'Thu', value: 4675 },
    { day: 'Fri', value: 5490 },
    { day: 'Sat', value: 3120 },
    { day: 'Sun', value: 2870 },
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
  private timer?: ReturnType<typeof setInterval>;
  private cursor = 0;
  private stickToBottom = true;

  trendVariant(positive: boolean): TagVariant {
    return positive ? 'success' : 'danger';
  }

  ngOnInit(): void {
    const now = Date.now();
    const seed: LogLine[] = [];
    for (let i = 5; i >= 0; i--) seed.push(this.nextLog(new Date(now - i * 3000)));
    this.logs.set(seed);
    this.timer = setInterval(() => {
      const el = this.logViewport?.nativeElement;
      this.stickToBottom = !el || el.scrollHeight - el.scrollTop - el.clientHeight < 8;
      this.logs.update((lines) => [...lines, this.nextLog(new Date())].slice(-200));
    }, 3000);
  }

  ngAfterViewChecked(): void {
    const el = this.logViewport?.nativeElement;
    if (el && this.stickToBottom) el.scrollTop = el.scrollHeight;
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  private nextLog(date: Date): LogLine {
    const template = LOG_TEMPLATES[this.cursor++ % LOG_TEMPLATES.length];
    return { ...template, time: date.toISOString().replace('T', ' ').slice(0, 19) };
  }
}
