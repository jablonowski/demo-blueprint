import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BadgeComponent } from '../../shared/badge/badge.component';
import { Tone } from '../../core/models/user.model';

interface StatTile {
  label: string;
  value: string;
  trend: string;
  trendTone: Tone;
  subLabel: string;
}

interface ThroughputBar {
  day: string;
  value: number;
}

interface ServiceStatus {
  name: string;
  status: 'Online' | 'Offline';
}

interface DataSummaryRow {
  label: string;
  value: string;
}

interface LogEntry {
  id: number;
  message: string;
  timestamp: string;
}

const LOG_MESSAGE_POOL = [
  'Health check passed for api-gateway-3.',
  'Cache layer evicted 128 stale keys.',
  'Auth service issued 42 new sessions.',
  'Storage service completed nightly backup.',
  'Analytics engine reconnect attempt failed.',
  'Request throughput within normal bounds.',
  'Rate limiter throttled 3 requests from 10.0.4.12.',
  'New deployment rolled out to production.',
  'Database connection pool resized to 50.',
  'Scheduled job "cleanup-sessions" completed.'
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [BadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('logViewport') logViewport?: ElementRef<HTMLDivElement>;

  statTiles: StatTile[] = [
    { label: 'Active Users', value: '1,284', trend: '+12%', trendTone: 'success', subLabel: 'vs last 7 days' },
    { label: 'Avg Response Time', value: '142ms', trend: '-8ms', trendTone: 'success', subLabel: 'vs last 7 days' },
    { label: 'Error Rate', value: '0.04%', trend: '+0.01%', trendTone: 'warning', subLabel: 'vs last 7 days' },
    { label: 'Uptime (30d)', value: '99.97%', trend: 'Stable', trendTone: 'success', subLabel: 'last 30 days' }
  ];

  throughputBars: ThroughputBar[] = [
    { day: 'Mon', value: 420 },
    { day: 'Tue', value: 512 },
    { day: 'Wed', value: 388 },
    { day: 'Thu', value: 601 },
    { day: 'Fri', value: 560 },
    { day: 'Sat', value: 310 },
    { day: 'Sun', value: 275 }
  ];

  services: ServiceStatus[] = [
    { name: 'API Gateway', status: 'Online' },
    { name: 'Auth Service', status: 'Online' },
    { name: 'Storage Service', status: 'Online' },
    { name: 'Analytics Engine', status: 'Offline' },
    { name: 'Cache Layer', status: 'Online' }
  ];

  dataSummary: DataSummaryRow[] = [
    { label: 'Requests/min', value: '4,820' },
    { label: 'Avg Response', value: '142 ms' },
    { label: 'Error Rate', value: '0.04%' },
    { label: 'Uptime (30d)', value: '99.97%' }
  ];

  logs: LogEntry[] = [];

  private nextLogId = 1;
  private intervalId?: ReturnType<typeof setInterval>;

  get maxThroughput(): number {
    return Math.max(...this.throughputBars.map((bar) => bar.value));
  }

  barHeightPercent(value: number): number {
    return (value / this.maxThroughput) * 100;
  }

  ngOnInit(): void {
    this.appendLog('System monitoring initialized.');
    this.intervalId = setInterval(() => {
      const message = LOG_MESSAGE_POOL[Math.floor(Math.random() * LOG_MESSAGE_POOL.length)];
      this.appendLog(message);
    }, 3000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private appendLog(message: string): void {
    this.logs.push({
      id: this.nextLogId++,
      message,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
    });
    queueMicrotask(() => {
      const el = this.logViewport?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }
}
