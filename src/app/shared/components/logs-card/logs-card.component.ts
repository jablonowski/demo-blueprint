import { Component, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-logs-card',
  standalone: true,
  template: `
    <div class="logs-container" #logContainer>
      @for (line of lines; track $index) {
        <div class="log-line">{{ line }}</div>
      }
    </div>
  `,
  styles: [`
    .logs-container {
      background: #0f1117; border-radius: 6px; padding: 12px; height: 160px;
      overflow-y: auto; font-family: monospace; font-size: 12px; color: #a8ff78;
      display: flex; flex-direction: column; gap: 2px;
    }
    .log-line { white-space: nowrap; line-height: 1.5; }
  `]
})
export class LogsCardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('logContainer') logContainer!: ElementRef<HTMLDivElement>;

  lines: string[] = [
    '[INFO]  2024-01-15 08:00:01  Service started successfully',
    '[INFO]  2024-01-15 08:00:03  Connected to database',
    '[WARN]  2024-01-15 08:01:12  High memory usage: 82%',
    '[INFO]  2024-01-15 08:02:05  Request processed: GET /api/users (200)',
    '[INFO]  2024-01-15 08:02:47  Cache refreshed'
  ];

  private readonly templates = [
    '[INFO]  Request processed: GET /api/users (200)',
    '[INFO]  Cache hit ratio: 94.2%',
    '[WARN]  Response time spike: 320ms',
    '[INFO]  Scheduled job completed successfully',
    '[ERROR] Failed to connect to analytics-engine: timeout',
    '[INFO]  Auth token refreshed for user session',
    '[INFO]  Backup snapshot created',
    '[WARN]  Disk usage at 78%',
    '[INFO]  Health check passed: all services OK'
  ];

  private intervalId?: ReturnType<typeof setInterval>;

  ngAfterViewInit(): void {
    this.intervalId = setInterval(() => {
      const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const tpl = this.templates[Math.floor(Math.random() * this.templates.length)];
      const parts = tpl.split(']');
      this.lines.push(`${parts[0]}]  ${ts}  ${parts.slice(1).join(']').trim()}`);
      if (this.lines.length > 50) this.lines.shift();
      setTimeout(() => {
        if (this.logContainer) this.logContainer.nativeElement.scrollTop = this.logContainer.nativeElement.scrollHeight;
      });
    }, 3000);
  }

  ngOnDestroy(): void { if (this.intervalId) clearInterval(this.intervalId); }
}
