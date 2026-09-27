import { DatePipe } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';

type Tone = 'success' | 'danger';

interface Metric {
  title: string;
  value: string;
  trend?: { label: string; tone: Tone };
  sub?: string;
}

interface LogLine {
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
}

const LOG_TEMPLATES: Omit<LogLine, 'time'>[] = [
  { level: 'INFO',  message: 'api-gateway: GET /api/users 200 (38ms)' },
  { level: 'INFO',  message: 'auth-service: token refreshed for session a91f' },
  { level: 'DEBUG', message: 'cache-layer: hit ratio 0.94 over last 60s' },
  { level: 'WARN',  message: 'analytics-engine: heartbeat missed (attempt 3/5)' },
  { level: 'INFO',  message: 'storage-service: snapshot completed in 1.2s' },
  { level: 'ERROR', message: 'analytics-engine: connection refused on :9200' },
  { level: 'INFO',  message: 'api-gateway: POST /api/events 202 (12ms)' },
  { level: 'DEBUG', message: 'scheduler: 4 jobs queued, 0 delayed' },
  { level: 'INFO',  message: 'auth-service: login succeeded for admin' },
  { level: 'WARN',  message: 'api-gateway: p95 latency 212ms above 200ms target' }
];

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('logViewport') private logViewport?: ElementRef<HTMLElement>;

  readonly updatedAt = new Date();

  readonly metrics: Metric[] = [
    { title: 'Active Users',      value: '1,284',  trend: { label: '+12%',   tone: 'success' }, sub: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms',  trend: { label: '-8ms',   tone: 'success' }, sub: 'vs last 7 days' },
    { title: 'Error Rate',        value: '0.04%',  trend: { label: '+0.01%', tone: 'danger' },  sub: 'vs last 7 days' },
    { title: 'Uptime (30d)',      value: '99.97%', trend: { label: 'Stable', tone: 'success' }, sub: 'last 30 days' }
  ];

  private readonly throughput = [
    { day: 'Mon', value: 4210 },
    { day: 'Tue', value: 4630 },
    { day: 'Wed', value: 5120 },
    { day: 'Thu', value: 4880 },
    { day: 'Fri', value: 5390 },
    { day: 'Sat', value: 3240 },
    { day: 'Sun', value: 2960 }
  ];
  private readonly maxThroughput = Math.max(...this.throughput.map(b => b.value));
  readonly bars = this.throughput.map(b => ({ ...b, pct: Math.round((b.value / this.maxThroughput) * 100) }));

  readonly services: { name: string; online: boolean }[] = [
    { name: 'API Gateway',      online: true },
    { name: 'Auth Service',     online: true },
    { name: 'Storage Service',  online: true },
    { name: 'Analytics Engine', online: false },
    { name: 'Cache Layer',      online: true }
  ];

  readonly summary = [
    { label: 'Requests/min', value: '4,820' },
    { label: 'Avg Response', value: '142 ms' },
    { label: 'Error Rate',   value: '0.04%' },
    { label: 'Uptime (30d)', value: '99.97%' }
  ];

  logs = signal<LogLine[]>([]);
  private timer?: ReturnType<typeof setInterval>;
  private cursor = 0;
  private stickToBottom = true;

  ngOnInit(): void {
    const now = Date.now();
    this.logs.set(Array.from({ length: 8 }, (_, i) => this.nextLine(new Date(now - (8 - i) * 3000))));
    this.timer = setInterval(() => {
      this.logs.update(lines => [...lines, this.nextLine(new Date())].slice(-200));
    }, 3000);
  }

  ngAfterViewChecked(): void {
    const el = this.logViewport?.nativeElement;
    if (el && this.stickToBottom) el.scrollTop = el.scrollHeight;
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  onLogScroll(el: HTMLElement): void {
    this.stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
  }

  private nextLine(date: Date): LogLine {
    const tpl = LOG_TEMPLATES[this.cursor++ % LOG_TEMPLATES.length];
    return { ...tpl, time: date.toTimeString().slice(0, 8) };
  }
}
