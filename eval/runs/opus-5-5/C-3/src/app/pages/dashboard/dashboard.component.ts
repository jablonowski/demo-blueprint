import { AfterViewChecked, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ListComponent, ListItemComponent, TagComponent, TagVariant } from '@jablonowski/dsb-components';

interface MetricTile {
  title: string;
  value: string;
  trend?: { label: string; direction: 'positive' | 'negative' };
  subLabel?: string;
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

const LOG_TEMPLATES: Array<Pick<LogLine, 'level' | 'message'>> = [
  { level: 'INFO', message: 'api-gateway: GET /api/users 200 (38 ms)' },
  { level: 'INFO', message: 'auth-service: token refreshed for session a91f' },
  { level: 'DEBUG', message: 'cache-layer: hit ratio 0.94 over last 60 s' },
  { level: 'INFO', message: 'storage-service: snapshot completed (2.1 GB)' },
  { level: 'WARN', message: 'analytics-engine: heartbeat missed, retrying' },
  { level: 'INFO', message: 'api-gateway: POST /api/events 202 (61 ms)' },
  { level: 'ERROR', message: 'analytics-engine: connection refused on :9042' },
  { level: 'INFO', message: 'scheduler: job metrics-rollup finished in 4.2 s' },
  { level: 'DEBUG', message: 'auth-service: 12 active sessions pruned' },
  { level: 'WARN', message: 'api-gateway: p95 latency 212 ms above target' },
];

@Component({
  selector: 'app-dashboard',
  imports: [ListComponent, ListItemComponent, TagComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements AfterViewChecked {
  readonly metrics: MetricTile[] = [
    { title: 'Active Users', value: '1,284', trend: { label: '+12%', direction: 'positive' }, subLabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', direction: 'positive' }, subLabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', direction: 'negative' }, subLabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', direction: 'positive' }, subLabel: 'last 30 days' },
  ];

  readonly throughput = [
    { day: 'Mon', value: 3920 },
    { day: 'Tue', value: 4480 },
    { day: 'Wed', value: 4820 },
    { day: 'Thu', value: 4310 },
    { day: 'Fri', value: 4650 },
    { day: 'Sat', value: 2740 },
    { day: 'Sun', value: 2380 },
  ];
  private readonly throughputMax = Math.max(...this.throughput.map((d) => d.value));
  readonly throughputBars = this.throughput.map((d) => ({
    ...d,
    percent: Math.round((d.value / this.throughputMax) * 100),
  }));
  readonly throughputStats = [
    { label: 'Peak', value: `${this.throughputMax.toLocaleString('en-US')} rpm` },
    {
      label: 'Average',
      value: `${Math.round(this.throughput.reduce((s, d) => s + d.value, 0) / this.throughput.length).toLocaleString('en-US')} rpm`,
    },
  ];

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

  readonly lastUpdated = new Date().toLocaleString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  readonly logs = signal<LogLine[]>([]);
  private readonly logViewer = viewChild<ElementRef<HTMLElement>>('logViewer');
  private nextLogId = 0;
  private scrollPending = false;

  constructor() {
    for (let i = 0; i < 6; i++) {
      this.appendLog(new Date(Date.now() - (6 - i) * 3000));
    }
    const timer = setInterval(() => this.appendLog(new Date()), 3000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  ngAfterViewChecked(): void {
    const el = this.logViewer()?.nativeElement;
    if (this.scrollPending && el) {
      el.scrollTop = el.scrollHeight;
      this.scrollPending = false;
    }
  }

  trendVariant(direction: 'positive' | 'negative'): TagVariant {
    return direction === 'positive' ? 'success' : 'danger';
  }

  private appendLog(at: Date): void {
    const template = LOG_TEMPLATES[this.nextLogId % LOG_TEMPLATES.length];
    const line: LogLine = {
      id: this.nextLogId++,
      time: at.toLocaleTimeString('en-GB', { hour12: false }),
      ...template,
    };
    this.logs.update((lines) => [...lines, line].slice(-100));
    this.scrollPending = true;
  }
}
