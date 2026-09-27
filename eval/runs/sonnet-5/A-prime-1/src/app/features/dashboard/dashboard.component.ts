import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

interface TrendMetric {
  title: string;
  value: string;
  trend: string;
  trendPositive: boolean;
  subLabel: string;
}

interface ThroughputBar {
  day: string;
  percent: number;
}

interface ServiceStatus {
  name: string;
  online: boolean;
}

interface SummaryItem {
  label: string;
  value: string;
}

const LOG_MESSAGES = [
  'Health check passed for api-gateway',
  'Cache layer synced 1,204 keys',
  'Auth token refreshed for session #4821',
  'Storage service compacted volume',
  'Analytics engine reconnect attempt failed',
  'Request throughput nominal',
  'Scheduled backup completed successfully',
  'New deployment rolled out to production',
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('logViewer') logViewerRef?: ElementRef<HTMLDivElement>;
  private shouldScrollLogs = false;

  metrics: TrendMetric[] = [
    { title: 'Active Users', value: '1,284', trend: '+12%', trendPositive: true, subLabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: '-8ms', trendPositive: true, subLabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: '+0.01%', trendPositive: false, subLabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: 'Stable', trendPositive: true, subLabel: 'last 30 days' },
  ];

  throughput: ThroughputBar[] = [
    { day: 'Mon', percent: 65 },
    { day: 'Tue', percent: 80 },
    { day: 'Wed', percent: 45 },
    { day: 'Thu', percent: 90 },
    { day: 'Fri', percent: 100 },
    { day: 'Sat', percent: 55 },
    { day: 'Sun', percent: 40 },
  ];

  services: ServiceStatus[] = [
    { name: 'API Gateway', online: true },
    { name: 'Auth Service', online: true },
    { name: 'Storage Service', online: true },
    { name: 'Analytics Engine', online: false },
    { name: 'Cache Layer', online: true },
  ];

  summary: SummaryItem[] = [
    { label: 'Requests/min', value: '4,820' },
    { label: 'Avg Response', value: '142 ms' },
    { label: 'Error Rate', value: '0.04%' },
    { label: 'Uptime (30d)', value: '99.97%' },
  ];

  logs: string[] = [
    '[10:42:01] INFO  api-gateway started listening on :8080',
    '[10:42:03] INFO  auth-service connected to session store',
    '[10:42:05] WARN  cache-layer eviction rate above threshold',
  ];

  private intervalId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      const message = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
      const timestamp = new Date().toTimeString().slice(0, 8);
      this.logs = [...this.logs, `[${timestamp}] INFO  ${message}`];
      this.shouldScrollLogs = true;
    }, 3000);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollLogs && this.logViewerRef) {
      const el = this.logViewerRef.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScrollLogs = false;
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
