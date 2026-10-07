import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { BadgeComponent, Tone } from '../../shared/badge.component';

interface Metric {
  title: string;
  value: string;
  trend?: { label: string; tone: Tone };
  subLabel?: string;
}

interface LogLine {
  id: number;
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

const LOG_TEMPLATES: Omit<LogLine, 'id' | 'time'>[] = [
  { level: 'INFO', message: 'GET /api/users 200 — 38 ms' },
  { level: 'INFO', message: 'Deployment succeeded: production @ a3f92b1' },
  { level: 'INFO', message: 'Cache Layer: hit ratio 94.2%' },
  { level: 'WARN', message: 'Auth Service: latency 420 ms (threshold 300 ms)' },
  { level: 'INFO', message: 'POST /api/sessions 201 — 54 ms' },
  { level: 'ERROR', message: 'Analytics Engine: connection refused on :9200' },
  { level: 'INFO', message: 'Storage Service: snapshot completed (2.4 GB)' },
  { level: 'INFO', message: 'API Gateway: 4,820 req/min' },
  { level: 'WARN', message: 'Queue depth above 1,000 messages' },
];

const MAX_LOG_LINES = 200;

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly metrics: Metric[] = [
    { title: 'Active Users', value: '1,284', trend: { label: '+12%', tone: 'success' }, subLabel: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', tone: 'success' }, subLabel: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', tone: 'warning' }, subLabel: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', tone: 'success' }, subLabel: 'last 30 days' },
  ];

  private readonly throughputData = [
    { day: 'Mon', value: 3920 },
    { day: 'Tue', value: 4480 },
    { day: 'Wed', value: 5210 },
    { day: 'Thu', value: 4870 },
    { day: 'Fri', value: 5640 },
    { day: 'Sat', value: 3110 },
    { day: 'Sun', value: 2760 },
  ];

  readonly throughput = (() => {
    const max = Math.max(...this.throughputData.map((d) => d.value));
    return this.throughputData.map((d) => ({ ...d, percent: Math.round((d.value / max) * 100) }));
  })();

  readonly services: { name: string; online: boolean }[] = [
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

  readonly lastUpdated = new Date();

  private nextLogId = 0;
  readonly logs = signal<LogLine[]>(Array.from({ length: 6 }, () => this.createLogLine()));
  readonly logCount = computed(() => this.logs().length);
  private readonly logViewport = viewChild.required<ElementRef<HTMLElement>>('logViewport');

  constructor() {
    const timer = setInterval(() => {
      this.logs.update((lines) => [...lines, this.createLogLine()].slice(-MAX_LOG_LINES));
    }, 3000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));

    // Keep the newest line in view as lines are appended.
    afterRenderEffect(() => {
      this.logCount();
      const el = this.logViewport().nativeElement;
      el.scrollTop = el.scrollHeight;
    });
  }

  private createLogLine(): LogLine {
    const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
    return {
      id: this.nextLogId++,
      time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      ...template,
    };
  }
}
