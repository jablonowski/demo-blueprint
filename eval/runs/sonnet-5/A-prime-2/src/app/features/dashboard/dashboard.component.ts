import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BadgeComponent, BadgeTone } from '../../shared/components/badge/badge.component';

interface MetricTile {
  title: string;
  value: string;
  trend: string;
  trendTone: BadgeTone;
  sublabel: string;
}

interface ThroughputBar {
  day: string;
  pct: number;
}

interface ServiceStatus {
  name: string;
  online: boolean;
}

interface SummaryRow {
  label: string;
  value: string;
}

const LOG_POOL = [
  'Health check passed for api-gateway-prod-3.',
  'Cache warmed for region eu-west-1.',
  'Scheduled backup completed successfully.',
  'New deployment rolled out to canary.',
  'Rate limiter triggered for client 10.2.4.18.',
  'Background job queue drained.',
  'Autoscaler added 1 instance to web-tier.',
  'Certificate renewal check completed.',
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [BadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('logViewport') logViewport?: ElementRef<HTMLDivElement>;

  lastUpdated = new Date().toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  metrics: MetricTile[] = [
    { title: 'Active Users', value: '1,284', trend: '+12%', trendTone: 'success', sublabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: '-8ms', trendTone: 'success', sublabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: '+0.01%', trendTone: 'warning', sublabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: 'Stable', trendTone: 'success', sublabel: 'last 30 days' },
  ];

  throughput: ThroughputBar[] = [
    { day: 'Mon', pct: 62 },
    { day: 'Tue', pct: 74 },
    { day: 'Wed', pct: 58 },
    { day: 'Thu', pct: 88 },
    { day: 'Fri', pct: 100 },
    { day: 'Sat', pct: 41 },
    { day: 'Sun', pct: 35 },
  ];

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

  logs: string[] = [
    '[12:00:01] INFO  system boot sequence complete.',
    '[12:00:04] INFO  connected to primary datastore.',
    '[12:00:09] INFO  listening on port 443.',
  ];

  private intervalId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.intervalId = setInterval(() => this.appendLog(), 3000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private appendLog(): void {
    const timestamp = new Date().toLocaleTimeString(undefined, { hour12: false });
    const message = LOG_POOL[Math.floor(Math.random() * LOG_POOL.length)];
    this.logs = [...this.logs, `[${timestamp}] INFO  ${message}`];

    queueMicrotask(() => {
      const el = this.logViewport?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }
}
