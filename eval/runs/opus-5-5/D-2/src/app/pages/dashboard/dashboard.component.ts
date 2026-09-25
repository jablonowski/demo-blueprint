import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { ListComponent, ListItemComponent, TagComponent, TagVariant } from '@jablonowski/dsb-components';

interface MetricTile {
  title: string;
  value: string;
  trend?: { label: string; positive: boolean };
  subLabel?: string;
}

interface ThroughputBar {
  day: string;
  value: number;
}

interface ServiceStatus {
  name: string;
  online: boolean;
}

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogLine {
  id: number;
  time: string;
  level: LogLevel;
  message: string;
}

const LOG_TEMPLATES: { level: LogLevel; message: string }[] = [
  { level: 'INFO', message: 'api-gateway: GET /api/users 200 in 42ms' },
  { level: 'INFO', message: 'auth-service: token refreshed for session a3f92b1' },
  { level: 'DEBUG', message: 'cache-layer: hit ratio 94.2% over last 60s' },
  { level: 'INFO', message: 'storage-service: snapshot completed (1.2 GB)' },
  { level: 'WARN', message: 'api-gateway: p95 latency 310ms exceeds 300ms threshold' },
  { level: 'ERROR', message: 'analytics-engine: health check failed, connection refused' },
  { level: 'INFO', message: 'auth-service: user admin signed in' },
  { level: 'DEBUG', message: 'scheduler: job metrics-rollup finished in 812ms' },
  { level: 'WARN', message: 'cache-layer: eviction rate above baseline' },
  { level: 'INFO', message: 'api-gateway: POST /api/users 201 in 58ms' },
];

@Component({
  selector: 'app-dashboard',
  imports: [TagComponent, ListComponent, ListItemComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('logViewport') private logViewport?: ElementRef<HTMLElement>;

  readonly metrics: MetricTile[] = [
    { title: 'Active Users', value: '1,284', trend: { label: '+12%', positive: true }, subLabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', positive: true }, subLabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', positive: false }, subLabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', positive: true }, subLabel: 'last 30 days' },
  ];

  readonly throughput: ThroughputBar[] = [
    { day: 'Mon', value: 3820 },
    { day: 'Tue', value: 4410 },
    { day: 'Wed', value: 5120 },
    { day: 'Thu', value: 4790 },
    { day: 'Fri', value: 5630 },
    { day: 'Sat', value: 2980 },
    { day: 'Sun', value: 2540 },
  ];

  private readonly maxThroughput = Math.max(...this.throughput.map((b) => b.value));

  readonly services: ServiceStatus[] = [
    { name: 'API Gateway', online: true },
    { name: 'Auth Service', online: true },
    { name: 'Storage Service', online: true },
    { name: 'Analytics Engine', online: false },
    { name: 'Cache Layer', online: true },
  ];

  readonly summary: { label: string; value: string }[] = [
    { label: 'Requests/min', value: '4,820' },
    { label: 'Avg Response', value: '142 ms' },
    { label: 'Error Rate', value: '0.04%' },
    { label: 'Uptime (30d)', value: '99.97%' },
  ];

  logs: LogLine[] = [];
  private nextLogId = 0;

  ngOnInit(): void {
    const now = Date.now();
    for (let i = 5; i > 0; i--) {
      this.appendLog(new Date(now - i * 3000));
    }
    const timer = setInterval(() => this.appendLog(new Date()), 3000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  barHeight(bar: ThroughputBar): number {
    return Math.round((bar.value / this.maxThroughput) * 100);
  }

  trendVariant(tile: MetricTile): TagVariant {
    return tile.trend?.positive ? 'success' : 'danger';
  }

  levelVariant(level: LogLevel): string {
    return `log-level--${level.toLowerCase()}`;
  }

  private appendLog(at: Date): void {
    const template = LOG_TEMPLATES[this.nextLogId % LOG_TEMPLATES.length];
    this.logs = [
      ...this.logs.slice(-199),
      { id: this.nextLogId++, time: at.toTimeString().slice(0, 8), ...template },
    ];
    // Keep the newest line in view, as a tailing terminal would.
    setTimeout(() => {
      const el = this.logViewport?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }
}
