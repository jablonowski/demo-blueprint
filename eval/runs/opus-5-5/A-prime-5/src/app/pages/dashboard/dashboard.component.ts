import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';

interface Metric {
  title: string;
  value: string;
  trend?: { label: string; positive: boolean };
  sub?: string;
}

interface LogLine {
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
}

const LOG_TEMPLATES: Omit<LogLine, 'time'>[] = [
  { level: 'INFO', message: 'GET /api/users 200 — 38ms' },
  { level: 'INFO', message: 'Deployment succeeded: production @ a3f92b1' },
  { level: 'DEBUG', message: 'Cache hit ratio 94.2% (cache-layer-01)' },
  { level: 'WARN', message: 'Latency spike detected: 420ms (threshold 300ms)' },
  { level: 'INFO', message: 'POST /api/auth/token 201 — 112ms' },
  { level: 'ERROR', message: 'analytics-engine: health check failed (connection refused)' },
  { level: 'INFO', message: 'Autoscaler: api-gateway replicas 4 → 5' },
  { level: 'DEBUG', message: 'storage-service: compaction finished in 1.8s' },
  { level: 'WARN', message: 'auth-service: token refresh retry 1/3' },
  { level: 'INFO', message: 'PUT /api/users/2 200 — 54ms' },
];

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="page-head">
      <h1 class="page-title">System Overview</h1>
      <p class="page-meta">Last updated: {{ updatedAt }}</p>
    </div>

    <div class="grid">
      @for (m of metrics; track m.title) {
        <section class="card tile metric">
          <span class="tile-label">{{ m.title }}</span>
          <div class="value-row">
            <span class="value">{{ m.value }}</span>
            @if (m.trend) {
              <span class="tag" [class.tag-success]="m.trend.positive" [class.tag-danger]="!m.trend.positive">{{ m.trend.label }}</span>
            }
          </div>
          @if (m.sub) {
            <span class="sub">{{ m.sub }}</span>
          }
        </section>
      }

      <section class="card tile span-7">
        <h2 class="tile-title">Request Throughput</h2>
        <p class="tile-caption">Requests per minute, last 7 days</p>
        <div class="divider"></div>
        <div class="chart" role="img" aria-label="Request throughput bar chart, Monday to Sunday">
          @for (bar of throughput; track bar.day) {
            <div class="bar-col">
              <div class="bar-track">
                <div class="bar" [style.height.%]="(bar.value / maxThroughput) * 100" [attr.title]="bar.value + ' rpm'"></div>
              </div>
              <span class="bar-label">{{ bar.day }}</span>
            </div>
          }
        </div>
      </section>

      <section class="card tile span-5">
        <h2 class="tile-title">Service Health</h2>
        <div class="rows">
          @for (s of services; track s.name) {
            <div class="row">
              <span>{{ s.name }}</span>
              <span class="tag" [class.tag-success]="s.online" [class.tag-danger]="!s.online">{{ s.online ? 'Online' : 'Offline' }}</span>
            </div>
          }
        </div>
      </section>

      <section class="card tile span-5">
        <h2 class="tile-title">Data Summary</h2>
        <div class="rows">
          @for (d of summary; track d.label) {
            <div class="row">
              <span class="row-label">{{ d.label }}</span>
              <span class="row-value">{{ d.value }}</span>
            </div>
          }
        </div>
      </section>

      <section class="card tile span-7">
        <div class="logs-head">
          <h2 class="tile-title">System Logs</h2>
          <span class="tag tag-success">Live</span>
        </div>
        <div class="terminal" #terminal>
          @for (line of logs(); track $index) {
            <div class="log-line">
              <span class="log-time">{{ line.time }}</span>
              <span [class]="'log-level lvl-' + line.level.toLowerCase()">{{ line.level }}</span>
              <span class="log-msg">{{ line.message }}</span>
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: `
    .page-head { margin-bottom: 16px; }
    .page-title { margin: 0; font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); }
    .page-meta { margin: 4px 0 0; font-size: var(--font-size-sm); color: var(--color-text-muted); }

    .grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 20px; }
    .tile { display: flex; flex-direction: column; padding: 20px; min-width: 0; }
    .metric { grid-column: span 3; gap: 8px; }
    .span-5 { grid-column: span 5; }
    .span-7 { grid-column: span 7; }

    .tile-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      letter-spacing: .06em;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }
    .value-row { display: flex; align-items: center; gap: 10px; }
    .value { font-size: var(--font-size-2xl); font-weight: var(--font-weight-semibold); line-height: 1.2; }
    .sub { font-size: var(--font-size-sm); color: var(--color-text-muted); }

    .tile-title { margin: 0; font-size: var(--font-size-base); font-weight: var(--font-weight-semibold); }
    .tile-caption { margin: 4px 0 0; font-size: var(--font-size-sm); color: var(--color-text-muted); }
    .divider { height: 1px; margin: 14px 0; background: var(--color-border); }

    .chart { display: flex; align-items: stretch; gap: 8px; height: 120px; margin-top: auto; }
    .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .bar-track { flex: 1; width: 100%; display: flex; align-items: flex-end; }
    .bar {
      width: 100%;
      background: var(--color-text-primary);
      border-radius: 3px;
      transition: height var(--duration-base) var(--easing-standard);
    }
    .bar-label { font-size: var(--font-size-xs); color: var(--color-text-muted); }

    .rows { display: flex; flex-direction: column; margin-top: 10px; }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      border-top: 1px solid var(--color-border);
      font-size: var(--font-size-base);
    }
    .row-label { color: var(--color-text-secondary); }
    .row-value { font-weight: var(--font-weight-semibold); }

    .logs-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .terminal {
      height: 220px;
      overflow-y: auto;
      padding: 12px 14px;
      border-radius: var(--radius-lg);
      background: var(--color-text-primary);
      color: var(--color-border);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: var(--font-size-sm);
      line-height: 1.7;
    }
    .log-line { display: flex; gap: 10px; white-space: nowrap; }
    .log-time { color: var(--color-text-secondary); }
    .log-level { width: 44px; flex-shrink: 0; font-weight: var(--font-weight-semibold); }
    .lvl-info { color: #16a34a; }
    .lvl-debug { color: var(--color-text-muted); }
    .lvl-warn { color: #ca8a04; }
    .lvl-error { color: #dc2626; }
    .log-msg { overflow: hidden; text-overflow: ellipsis; }

    @media (max-width: 1100px) {
      .metric { grid-column: span 6; }
      .span-5, .span-7 { grid-column: span 12; }
    }
    @media (max-width: 600px) {
      .metric { grid-column: span 12; }
    }
  `,
})
export class DashboardComponent {
  private terminal = viewChild<ElementRef<HTMLElement>>('terminal');

  readonly updatedAt = new Date().toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  readonly metrics: Metric[] = [
    { title: 'Active Users', value: '1,284', trend: { label: '+12%', positive: true }, sub: 'vs last 7 days' },
    { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', positive: true }, sub: 'vs last 7 days' },
    { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', positive: false }, sub: 'vs last 7 days' },
    { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', positive: true }, sub: 'last 30 days' },
  ];

  readonly throughput = [
    { day: 'Mon', value: 4120 },
    { day: 'Tue', value: 4630 },
    { day: 'Wed', value: 5210 },
    { day: 'Thu', value: 4880 },
    { day: 'Fri', value: 5560 },
    { day: 'Sat', value: 3240 },
    { day: 'Sun', value: 2980 },
  ];
  readonly maxThroughput = Math.max(...this.throughput.map((b) => b.value));

  readonly services = [
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

  readonly logs = signal<LogLine[]>(Array.from({ length: 6 }, (_, i) => this.makeLine(i)));
  private tick = 6;

  constructor() {
    const id = setInterval(() => {
      this.logs.update((lines) => [...lines, this.makeLine(this.tick++)].slice(-200));
      setTimeout(() => this.scrollToEnd());
    }, 3000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }

  private makeLine(i: number): LogLine {
    const t = LOG_TEMPLATES[i % LOG_TEMPLATES.length];
    return { ...t, time: new Date().toLocaleTimeString('en-GB', { hour12: false }) };
  }

  private scrollToEnd(): void {
    const el = this.terminal()?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
