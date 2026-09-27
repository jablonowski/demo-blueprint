import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

const LOG_TEMPLATES = [
  'Health check passed for api-gateway-3',
  'Cache layer evicted 128 stale keys',
  'Auth token refreshed for session 8f2c',
  'Storage replication lag: 12ms',
  'Analytics engine reconnect attempt failed',
  'Deployment rollout completed (v2.4.1)',
  'Rate limiter reset for tenant acme-corp',
  'Backup job finished in 42s',
  'Incoming webhook processed (200 OK)',
  'Queue depth normalized to 3 messages'
];

@Component({
  selector: 'app-system-logs',
  standalone: true,
  templateUrl: './system-logs.component.html',
  styleUrl: './system-logs.component.css'
})
export class SystemLogsComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('viewport') private viewportRef?: ElementRef<HTMLElement>;

  lines: string[] = [];
  private timerId?: ReturnType<typeof setInterval>;
  private shouldScroll = false;

  ngOnInit(): void {
    this.lines = [this.formatLine(LOG_TEMPLATES[0])];
    this.timerId = setInterval(() => {
      const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
      this.lines = [...this.lines, this.formatLine(template)];
      this.shouldScroll = true;
    }, 3000);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.viewportRef) {
      const el = this.viewportRef.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  private formatLine(message: string): string {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    return `[${time}] ${message}`;
  }
}
