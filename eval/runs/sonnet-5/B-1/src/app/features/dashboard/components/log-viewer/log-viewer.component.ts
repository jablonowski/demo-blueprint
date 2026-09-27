import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

const SAMPLE_MESSAGES = [
  'Health check passed for api-gateway-02',
  'Cache layer evicted 128 stale keys',
  'Auth service issued 42 new tokens',
  'Scheduled backup completed successfully',
  'Analytics engine reconnect attempt failed',
  'Deployment pipeline queued for build #4821',
  'Rate limiter throttled 3 requests from 10.2.4.18',
  'Storage service reclaimed 2.1 GB of temp files',
  'New service instance registered: worker-07',
  'Certificate renewal succeeded for *.blueprint.dev',
];

interface LogLine {
  timestamp: string;
  message: string;
}

@Component({
  selector: 'app-log-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './log-viewer.component.html',
  styleUrl: './log-viewer.component.css',
})
export class LogViewerComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('scrollRegion') private scrollRegion?: ElementRef<HTMLDivElement>;

  lines: LogLine[] = [];

  private intervalId?: ReturnType<typeof setInterval>;
  private shouldScroll = false;

  ngOnInit(): void {
    this.lines.push(this.buildLine());
    this.intervalId = setInterval(() => {
      this.lines = [...this.lines, this.buildLine()];
      this.shouldScroll = true;
    }, 3000);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.scrollRegion) {
      const el = this.scrollRegion.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private buildLine(): LogLine {
    const message = SAMPLE_MESSAGES[Math.floor(Math.random() * SAMPLE_MESSAGES.length)];
    return { timestamp: new Date().toLocaleTimeString(), message };
  }
}
