import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { ListComponent, ListItemComponent, ListItemVariant, TagComponent } from '@jablonowski/dsb-components';

type Trend = 'positive' | 'negative';

interface MetricTile {
  title: string;
  value: string;
  trend?: { label: string; reads: Trend };
  subLabel?: string;
}

interface ThroughputBar {
  day: string;
  requests: number;
}

interface ServiceStatus {
  name: string;
  online: boolean;
}

interface LogLine {
  id: number;
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
}

const LOG_TEMPLATES: Omit<LogLine, 'id' | 'time'>[] = [
  { level: 'INFO', message: 'GET /api/users 200 — 38 ms' },
  { level: 'INFO', message: 'auth-service: token refreshed for session a3f92b1' },
  { level: 'DEBUG', message: 'cache-layer: hit ratio 0.94 over last 60 s' },
  { level: 'WARN', message: 'storage-service: latency 420 ms (threshold 300 ms)' },
  { level: 'INFO', message: 'api-gateway: 4,820 req/min, p95 142 ms' },
  { level: 'ERROR', message: 'analytics-engine: health check failed — connection refused' },
  { level: 'INFO', message: 'POST /api/users 201 — 52 ms' },
  { level: 'DEBUG', message: 'scheduler: job metrics-rollup completed in 1.2 s' },
  { level: 'WARN', message: 'auth-service: 3 failed login attempts from 10.0.4.17' },
  { level: 'INFO', message: 'deploy: production healthy after rollout of build 1.8.4' },
];

@Component({
  selector: 'app-dashboard',
  imports: [TagComponent, ListComponent, ListItemComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewChecked {
  readonly metrics: MetricTile[] = [
    { title: 'Active Users', value: '1,284', trend: { label: '+12%', reads: 'positive' }, subLabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', reads: 'positive' }, subLabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', reads: 'negative' }, subLabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', reads: 'positive' }, subLabel: 'last 30 days' },
  ];

  readonly throughput: ThroughputBar[] = [
    { day: 'Mon', requests: 4210 },
    { day: 'Tue', requests: 4630 },
    { day: 'Wed', requests: 5120 },
    { day: 'Thu', requests: 4890 },
    { day: 'Fri', requests: 5480 },
    { day: 'Sat', requests: 3260 },
    { day: 'Sun', requests: 2980 },
  ];

  private readonly maxRequests = Math.max(...this.throughput.map((b) => b.requests));

  readonly services: ServiceStatus[] = [
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
  private readonly logViewport = viewChild<ElementRef<HTMLElement>>('logViewport');
  private nextLogId = 0;
  private templateIndex = 0;
  private timer?: ReturnType<typeof setInterval>;
  private scrollPending = false;

  readonly lastUpdated = new Date().toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  barHeight(bar: ThroughputBar): number {
    return Math.round((bar.requests / this.maxRequests) * 100);
  }

  trendVariant(reads: Trend): 'success' | 'danger' {
    return reads === 'positive' ? 'success' : 'danger';
  }

  logVariant(level: LogLine['level']): ListItemVariant {
    switch (level) {
      case 'ERROR':
        return 'error';
      case 'WARN':
        return 'warning';
      case 'DEBUG':
        return 'default';
      default:
        return 'info';
    }
  }

  ngOnInit(): void {
    for (let i = 0; i < 6; i++) {
      this.appendLog(new Date(Date.now() - (6 - i) * 3000));
    }
    this.timer = setInterval(() => this.appendLog(new Date()), 3000);
  }

  ngAfterViewChecked(): void {
    const viewport = this.logViewport()?.nativeElement;
    if (this.scrollPending && viewport) {
      viewport.scrollTop = viewport.scrollHeight;
      this.scrollPending = false;
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  private appendLog(at: Date): void {
    const template = LOG_TEMPLATES[this.templateIndex++ % LOG_TEMPLATES.length];
    const line: LogLine = { id: this.nextLogId++, time: at.toTimeString().slice(0, 8), ...template };
    this.logs.update((lines) => [...lines, line].slice(-100));
    this.scrollPending = true;
  }
}
