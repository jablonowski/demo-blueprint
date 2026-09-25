import { AfterViewChecked, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';

type Tone = 'positive' | 'negative';
type LogLevel = 'INFO' | 'OK' | 'WARN' | 'ERROR';

interface Metric {
  title: string;
  value: string;
  trend?: { label: string; tone: Tone };
  sub?: string;
}

interface LogLine {
  id: number;
  time: Date;
  level: LogLevel;
  source: string;
  message: string;
}

const LOG_TEMPLATES: Array<Omit<LogLine, 'id' | 'time'>> = [
  { level: 'INFO', source: 'api-gateway', message: 'GET /api/users 200 in 38ms' },
  { level: 'OK', source: 'deploy', message: 'Production deployed from commit a3f92b1' },
  { level: 'INFO', source: 'auth', message: 'Token refreshed for session 7f2c' },
  { level: 'WARN', source: 'cache', message: 'Hit ratio dropped to 81% (threshold 85%)' },
  { level: 'INFO', source: 'storage', message: 'Snapshot vol-04 completed (2.1 GB)' },
  { level: 'ERROR', source: 'analytics', message: 'Worker heartbeat missed, retrying in 5s' },
  { level: 'INFO', source: 'api-gateway', message: 'POST /api/events 202 in 12ms' },
  { level: 'WARN', source: 'api-gateway', message: 'Latency spike detected: 420ms (threshold 300ms)' },
  { level: 'OK', source: 'health', message: 'All probes passing on 12/12 nodes' },
];

const MAX_LOG_LINES = 200;

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements AfterViewChecked {
  protected readonly updatedAt = new Date();

  protected readonly metrics: Metric[] = [
    { title: 'Active Users', value: '1,284', trend: { label: '+12%', tone: 'positive' }, sub: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', tone: 'positive' }, sub: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', tone: 'negative' }, sub: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', tone: 'positive' }, sub: 'last 30 days' },
  ];

  private readonly throughputRaw = [
    { day: 'Mon', value: 3920 },
    { day: 'Tue', value: 4410 },
    { day: 'Wed', value: 4820 },
    { day: 'Thu', value: 4550 },
    { day: 'Fri', value: 4180 },
    { day: 'Sat', value: 2760 },
    { day: 'Sun', value: 2340 },
  ];
  private readonly throughputMax = Math.max(...this.throughputRaw.map(d => d.value));
  protected readonly throughput = this.throughputRaw.map(d => ({
    ...d,
    pct: Math.round((d.value / this.throughputMax) * 100),
  }));

  protected readonly services: Array<{ name: string; online: boolean }> = [
    { name: 'API Gateway', online: true },
    { name: 'Auth Service', online: true },
    { name: 'Storage Service', online: true },
    { name: 'Analytics Engine', online: false },
    { name: 'Cache Layer', online: true },
  ];

  protected readonly summary = [
    { label: 'Requests/min', value: '4,820' },
    { label: 'Avg Response', value: '142 ms' },
    { label: 'Error Rate', value: '0.04%' },
    { label: 'Uptime (30d)', value: '99.97%' },
  ];

  protected readonly logs = signal<LogLine[]>([]);
  private readonly logView = viewChild<ElementRef<HTMLElement>>('logView');
  private nextId = 0;
  private stickToBottom = true;

  constructor() {
    const now = Date.now();
    this.logs.set(Array.from({ length: 6 }, (_, i) => this.makeLine(new Date(now - (6 - i) * 3000))));
    const timer = setInterval(() => this.appendLine(), 3000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  ngAfterViewChecked(): void {
    const el = this.logView()?.nativeElement;
    if (el && this.stickToBottom) el.scrollTop = el.scrollHeight;
  }

  protected onLogScroll(el: HTMLElement): void {
    this.stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
  }

  private appendLine(): void {
    this.logs.update(lines => [...lines, this.makeLine(new Date())].slice(-MAX_LOG_LINES));
  }

  private makeLine(time: Date): LogLine {
    const t = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
    return { id: this.nextId++, time, ...t };
  }
}
