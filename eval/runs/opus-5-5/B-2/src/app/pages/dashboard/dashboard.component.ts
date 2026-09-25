import { DatePipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { TagComponent, TagVariant } from '@jablonowski/dsb-components';

interface MetricTile {
  title: string;
  value: string;
  trend?: { label: string; variant: TagVariant };
  subLabel?: string;
}

interface ServiceStatus {
  name: string;
  online: boolean;
}

type LogLevel = 'INFO' | 'OK' | 'WARN' | 'ERROR';

interface LogLine {
  id: number;
  time: Date;
  level: LogLevel;
  message: string;
}

const LOG_TEMPLATES: ReadonlyArray<[LogLevel, string]> = [
  ['OK', 'api-gateway: GET /api/users 200 in 38ms'],
  ['INFO', 'auth-service: token refreshed for session 7f3a'],
  ['OK', 'storage: snapshot uploaded (2.4 MB)'],
  ['WARN', 'cache-layer: hit ratio dropped to 81%'],
  ['INFO', 'scheduler: job metrics-rollup started'],
  ['ERROR', 'analytics-engine: connection refused on :9090'],
  ['OK', 'api-gateway: POST /api/sessions 201 in 64ms'],
  ['INFO', 'deploy: build a3f92b1 promoted to production'],
  ['WARN', 'api-gateway: p95 latency 212ms above target'],
  ['OK', 'health-check: 4 of 5 services responding'],
];

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, TagComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  readonly lastUpdated = new Date();

  readonly metrics: MetricTile[] = [
    { title: 'Active Users', value: '1,284', trend: { label: '+12%', variant: 'success' }, subLabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', variant: 'success' }, subLabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', variant: 'warning' }, subLabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', variant: 'success' }, subLabel: 'last 30 days' },
  ];

  private readonly throughputRaw = [
    { day: 'Mon', value: 3920 },
    { day: 'Tue', value: 4410 },
    { day: 'Wed', value: 4820 },
    { day: 'Thu', value: 4560 },
    { day: 'Fri', value: 5130 },
    { day: 'Sat', value: 2980 },
    { day: 'Sun', value: 2640 },
  ];

  private readonly throughputMax = Math.max(...this.throughputRaw.map((d) => d.value));

  readonly throughput = this.throughputRaw.map((d) => ({
    ...d,
    percent: Math.round((d.value / this.throughputMax) * 100),
  }));

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

  private nextLogId = 0;
  private templateIndex = 0;
  readonly logs = signal<LogLine[]>(this.seedLogs());

  private readonly logViewport = viewChild.required<ElementRef<HTMLElement>>('logViewport');

  constructor() {
    const timer = setInterval(() => this.appendLog(), 3000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));

    // Keep the newest line in view as the log grows.
    afterRenderEffect(() => {
      this.logs();
      const el = this.logViewport().nativeElement;
      el.scrollTop = el.scrollHeight;
    });
  }

  private seedLogs(): LogLine[] {
    const now = Date.now();
    return Array.from({ length: 6 }, (_, i) => this.makeLog(new Date(now - (6 - i) * 3000)));
  }

  private makeLog(time: Date): LogLine {
    const [level, message] = LOG_TEMPLATES[this.templateIndex++ % LOG_TEMPLATES.length];
    return { id: this.nextLogId++, time, level, message };
  }

  private appendLog(): void {
    this.logs.update((lines) => [...lines, this.makeLog(new Date())].slice(-100));
  }
}
