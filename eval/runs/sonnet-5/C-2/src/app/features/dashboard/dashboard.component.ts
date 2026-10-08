import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TagComponent } from '@jablonowski/dsb-components';

interface StatTile {
  label: string;
  value: string;
  trend: string;
  trendVariant: 'success' | 'danger';
  caption: string;
}

interface ThroughputBar {
  day: string;
  pct: number;
}

interface ServiceStatus {
  name: string;
  status: 'Online' | 'Offline';
}

interface SummaryRow {
  label: string;
  value: string;
}

const LOG_LINES = [
  'Deployment succeeded: production updated to build a3f92b1.',
  'Cache layer: eviction cycle completed, 128MB reclaimed.',
  'Auth service: token refresh batch processed (412 sessions).',
  'Storage service: backup snapshot completed successfully.',
  'API gateway: rate limit threshold adjusted for /v1/users.',
  'Analytics engine: reconnect attempt failed, retrying in 10s.',
  'Queue worker: processed 1,204 jobs in the last interval.',
  'Database: replication lag within normal bounds (12ms).'
];

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, TagComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('logViewport') logViewport?: ElementRef<HTMLDivElement>;

  private shouldScroll = false;
  private intervalId?: ReturnType<typeof setInterval>;

  lastUpdated = new Date();

  statTiles: StatTile[] = [
    { label: 'Active Users', value: '1,284', trend: '+12%', trendVariant: 'success', caption: 'vs last 7 days' },
    { label: 'Avg Response Time', value: '142ms', trend: '-8ms', trendVariant: 'success', caption: 'vs last 7 days' },
    { label: 'Error Rate', value: '0.04%', trend: '+0.01%', trendVariant: 'danger', caption: 'vs last 7 days' },
    { label: 'Uptime (30d)', value: '99.97%', trend: 'Stable', trendVariant: 'success', caption: 'last 30 days' }
  ];

  throughputBars: ThroughputBar[] = [
    { day: 'Mon', pct: 64 },
    { day: 'Tue', pct: 82 },
    { day: 'Wed', pct: 76 },
    { day: 'Thu', pct: 92 },
    { day: 'Fri', pct: 100 },
    { day: 'Sat', pct: 44 },
    { day: 'Sun', pct: 36 }
  ];

  services: ServiceStatus[] = [
    { name: 'API Gateway', status: 'Online' },
    { name: 'Auth Service', status: 'Online' },
    { name: 'Storage Service', status: 'Online' },
    { name: 'Analytics Engine', status: 'Offline' },
    { name: 'Cache Layer', status: 'Online' }
  ];

  summary: SummaryRow[] = [
    { label: 'Requests/min', value: '4,820' },
    { label: 'Avg Response', value: '142 ms' },
    { label: 'Error Rate', value: '0.04%' },
    { label: 'Uptime (30d)', value: '99.97%' }
  ];

  logs: string[] = [];

  ngOnInit(): void {
    this.logs = LOG_LINES.slice(0, 5).map((line) => this.formatLog(line));
    this.intervalId = setInterval(() => this.appendLog(), 3000);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.logViewport) {
      const el = this.logViewport.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private appendLog(): void {
    const line = LOG_LINES[Math.floor(Math.random() * LOG_LINES.length)];
    this.logs = [...this.logs, this.formatLog(line)].slice(-50);
    this.shouldScroll = true;
  }

  private formatLog(line: string): string {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    return `[${time}] ${line}`;
  }
}
