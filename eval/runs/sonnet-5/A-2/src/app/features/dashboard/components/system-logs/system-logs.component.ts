import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

const MESSAGES = [
  'Health check passed for api-gateway',
  'Cache layer evicted 42 stale keys',
  'Auth service issued 18 new tokens',
  'Storage service completed backup snapshot',
  'Analytics engine reconnect attempt failed',
  'Request throughput nominal at 4.8k rpm',
  'Scheduled job "cleanup-sessions" finished',
  'New deployment rolled out to region us-east-1',
  'Rate limiter reset for client pool',
  'Database connection pool resized to 32'
];

const LEVELS = ['INFO', 'INFO', 'INFO', 'WARN', 'ERROR'];

interface LogLine {
  time: string;
  level: string;
  message: string;
}

@Component({
  selector: 'app-system-logs',
  standalone: true,
  imports: [],
  templateUrl: './system-logs.component.html',
  styleUrl: './system-logs.component.scss'
})
export class SystemLogsComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('logViewport') private logViewport?: ElementRef<HTMLElement>;

  logs: LogLine[] = [];
  private timer?: ReturnType<typeof setInterval>;
  private shouldScroll = false;

  ngOnInit(): void {
    this.logs = Array.from({ length: 5 }, () => this.randomLog());
    this.timer = setInterval(() => {
      this.logs = [...this.logs, this.randomLog()].slice(-100);
      this.shouldScroll = true;
    }, 3000);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.logViewport) {
      const el = this.logViewport.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private randomLog(): LogLine {
    const now = new Date();
    const time = now.toTimeString().slice(0, 8);
    const level = LEVELS[Math.floor(Math.random() * LEVELS.length)];
    const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    return { time, level, message };
  }
}
