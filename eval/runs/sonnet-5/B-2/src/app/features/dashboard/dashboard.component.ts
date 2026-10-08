import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ListComponent, ListItemComponent } from '@jablonowski/dsb-components';
import { MetricTileComponent } from './metric-tile.component';

interface ThroughputDay {
  label: string;
  value: number;
  percent: number;
}

interface ServiceStatus {
  name: string;
  online: boolean;
}

interface SummaryRow {
  label: string;
  value: string;
}

const LOG_TEMPLATES = [
  'Health check passed for all services',
  'Cache layer refreshed successfully',
  'Elevated latency detected on auth-service',
  'Scheduled backup completed',
  'New deployment rolled out to production',
  'Garbage collection cycle completed',
  'Rate limiter threshold adjusted',
  'Incoming request burst handled without errors',
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MetricTileComponent, ListComponent, ListItemComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('logViewport') logViewport?: ElementRef<HTMLDivElement>;

  throughput: ThroughputDay[] = this.buildThroughput();

  services: ServiceStatus[] = [
    { name: 'API Gateway', online: true },
    { name: 'Auth Service', online: true },
    { name: 'Storage Service', online: true },
    { name: 'Analytics Engine', online: false },
    { name: 'Cache Layer', online: true },
  ];

  summary: SummaryRow[] = [
    { label: 'Requests/min', value: '4,820' },
    { label: 'Avg Response', value: '142 ms' },
    { label: 'Error Rate', value: '0.04%' },
    { label: 'Uptime (30d)', value: '99.97%' },
  ];

  logs: string[] = [this.formatLog('System monitoring initialized')];

  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.timer = setInterval(() => this.appendLog(), 3000);
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private appendLog(): void {
    const line = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
    this.logs = [...this.logs, this.formatLog(line)].slice(-50);
    queueMicrotask(() => this.scrollLogsToBottom());
  }

  private formatLog(message: string): string {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    return `[${time}] ${message}`;
  }

  private scrollLogsToBottom(): void {
    const el = this.logViewport?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }

  private buildThroughput(): ThroughputDay[] {
    const raw = [
      { label: 'Mon', value: 420 },
      { label: 'Tue', value: 465 },
      { label: 'Wed', value: 500 },
      { label: 'Thu', value: 480 },
      { label: 'Fri', value: 530 },
      { label: 'Sat', value: 290 },
      { label: 'Sun', value: 260 },
    ];
    const max = Math.max(...raw.map((d) => d.value));
    return raw.map((d) => ({ ...d, percent: Math.round((d.value / max) * 100) }));
  }
}
