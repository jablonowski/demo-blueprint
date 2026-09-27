import { NgFor } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ListComponent, ListItemComponent, TagComponent } from '@jablonowski/dsb-components';
import { MetricTileComponent } from './metric-tile.component';

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

const LOG_MESSAGES = [
  'Health check passed for all core services.',
  'Cache Layer refreshed 1,204 keys.',
  'Scheduled backup completed successfully.',
  'Auth Service issued 42 new session tokens.',
  'Storage Service compacted 3 volumes.',
  'API Gateway handled request spike without errors.',
  'Analytics Engine reconnect attempt failed.',
  'Rate limiter throttled 6 requests from 10.0.4.12.',
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgFor, MetricTileComponent, ListComponent, ListItemComponent, TagComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly throughput: ThroughputBar[] = this.buildThroughput();

  readonly services: ServiceStatus[] = [
    { name: 'API Gateway', online: true },
    { name: 'Auth Service', online: true },
    { name: 'Storage Service', online: true },
    { name: 'Analytics Engine', online: false },
    { name: 'Cache Layer', online: true },
  ];

  readonly summary: SummaryRow[] = [
    { label: 'Requests/min', value: '4,820' },
    { label: 'Avg Response', value: '142 ms' },
    { label: 'Error Rate', value: '0.04%' },
    { label: 'Uptime (30d)', value: '99.97%' },
  ];

  logLines: string[] = ['[00:00:00] System monitor initialised.'];

  @ViewChild('terminal') private terminalRef?: ElementRef<HTMLDivElement>;

  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.timer = setInterval(() => this.appendLogLine(), 3000);
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private appendLogLine(): void {
    const message = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
    const timestamp = new Date().toLocaleTimeString('en-GB');
    this.logLines = [...this.logLines, `[${timestamp}] ${message}`].slice(-50);
    setTimeout(() => {
      const el = this.terminalRef?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }

  private buildThroughput(): ThroughputBar[] {
    const raw = [
      { day: 'Mon', value: 62 },
      { day: 'Tue', value: 78 },
      { day: 'Wed', value: 55 },
      { day: 'Thu', value: 90 },
      { day: 'Fri', value: 84 },
      { day: 'Sat', value: 40 },
      { day: 'Sun', value: 35 },
    ];
    const max = Math.max(...raw.map((r) => r.value));
    return raw.map((r) => ({ day: r.day, pct: Math.round((r.value / max) * 100) }));
  }
}
