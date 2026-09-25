import { AfterViewChecked, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';

interface Metric {
  title: string;
  value: string;
  trend: string;
  positive: boolean;
  caption: string;
}

interface LogLine {
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
}

const LOG_TEMPLATES: Omit<LogLine, 'time'>[] = [
  { level: 'INFO', message: 'GET /api/users 200 — 38ms' },
  { level: 'INFO', message: 'auth-service: token refreshed for session a91f' },
  { level: 'DEBUG', message: 'cache-layer: hit ratio 94.2%' },
  { level: 'WARN', message: 'analytics-engine: heartbeat missed, retrying' },
  { level: 'INFO', message: 'POST /api/events 201 — 52ms' },
  { level: 'ERROR', message: 'analytics-engine: connection refused (10.0.4.17:9000)' },
  { level: 'INFO', message: 'storage-service: snapshot completed in 1.2s' },
  { level: 'DEBUG', message: 'api-gateway: 4,820 req/min over last window' },
  { level: 'INFO', message: 'PUT /api/users/3 200 — 44ms' }
];

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements AfterViewChecked {
  private readonly logViewport = viewChild.required<ElementRef<HTMLElement>>('logViewport');
  private logIndex = 0;
  private stickToBottom = true;

  protected readonly metrics: Metric[] = [
    { title: 'Active Users', value: '1,284', trend: '+12%', positive: true, caption: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: '-8ms', positive: true, caption: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: '+0.01%', positive: false, caption: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: 'Stable', positive: true, caption: 'last 30 days' }
  ];

  private readonly throughputRaw = [
    { day: 'Mon', value: 3200 },
    { day: 'Tue', value: 4100 },
    { day: 'Wed', value: 3800 },
    { day: 'Thu', value: 4820 },
    { day: 'Fri', value: 4400 },
    { day: 'Sat', value: 2600 },
    { day: 'Sun', value: 2100 }
  ];
  private readonly throughputMax = Math.max(...this.throughputRaw.map(d => d.value));
  protected readonly throughput = this.throughputRaw.map(d => ({
    ...d,
    percent: Math.round((d.value / this.throughputMax) * 100)
  }));

  protected readonly services = [
    { name: 'API Gateway', online: true },
    { name: 'Auth Service', online: true },
    { name: 'Storage Service', online: true },
    { name: 'Analytics Engine', online: false },
    { name: 'Cache Layer', online: true }
  ];

  protected readonly summary = [
    { label: 'Requests/min', value: '4,820' },
    { label: 'Avg Response', value: '142 ms' },
    { label: 'Error Rate', value: '0.04%' },
    { label: 'Uptime (30d)', value: '99.97%' }
  ];

  protected readonly logs = signal<LogLine[]>(
    Array.from({ length: 6 }, (_, i) => this.nextLog(new Date(Date.now() - (6 - i) * 3000)))
  );

  constructor() {
    const timer = setInterval(() => this.logs.update(lines => [...lines, this.nextLog(new Date())].slice(-200)), 3000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  ngAfterViewChecked(): void {
    const el = this.logViewport().nativeElement;
    if (this.stickToBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }

  protected onLogScroll(): void {
    const el = this.logViewport().nativeElement;
    this.stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
  }

  private nextLog(date: Date): LogLine {
    const template = LOG_TEMPLATES[this.logIndex++ % LOG_TEMPLATES.length];
    return { ...template, time: date.toISOString().slice(11, 19) };
  }
}
