import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  time: string;
  level: LogLevel;
  message: string;
}

const MESSAGE_POOL: Array<{ level: LogLevel; message: string }> = [
  { level: 'INFO', message: 'GET /api/users 200 OK' },
  { level: 'INFO', message: 'Health check passed for cache-layer' },
  { level: 'INFO', message: 'Request handled in 84ms' },
  { level: 'WARN', message: 'Response time above 300ms threshold' },
  { level: 'INFO', message: 'Scheduled job "cleanup-sessions" completed' },
  { level: 'ERROR', message: 'Connection to analytics-engine timed out' },
  { level: 'INFO', message: 'POST /api/users 201 Created' },
  { level: 'WARN', message: 'Retrying failed request (attempt 2/3)' },
  { level: 'INFO', message: 'Cache hit ratio 94.2%' },
  { level: 'INFO', message: 'DELETE /api/users/4 204 No Content' }
];

@Component({
  selector: 'app-system-logs',
  standalone: true,
  template: `
    <div class="ui-card system-logs">
      <div class="ui-card__header">
        <span class="ui-card__title">System Logs</span>
      </div>
      <div class="system-logs__terminal" #terminal>
        @for (entry of entries; track $index) {
          <div class="system-logs__line">
            <span class="system-logs__time">{{ entry.time }}</span>
            <span class="system-logs__level" [class]="'system-logs__level--' + entry.level">{{
              entry.level
            }}</span>
            <span class="system-logs__message">{{ entry.message }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './system-logs.component.css'
})
export class SystemLogsComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('terminal') private terminalRef?: ElementRef<HTMLDivElement>;

  entries: LogEntry[] = [];
  private intervalId?: ReturnType<typeof setInterval>;
  private shouldScroll = false;

  ngOnInit(): void {
    for (let i = 0; i < 4; i++) {
      this.entries.push(this.buildEntry());
    }
    this.shouldScroll = true;

    this.intervalId = setInterval(() => {
      this.entries.push(this.buildEntry());
      if (this.entries.length > 200) {
        this.entries.shift();
      }
      this.shouldScroll = true;
    }, 3000);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.terminalRef) {
      const el = this.terminalRef.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  private buildEntry(): LogEntry {
    const pick = MESSAGE_POOL[Math.floor(Math.random() * MESSAGE_POOL.length)];
    return { time: this.formatTime(new Date()), ...pick };
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-GB', { hour12: false });
  }
}
