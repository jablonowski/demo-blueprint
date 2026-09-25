import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { BadgeComponent } from '../../shared/badge.component';
import { DATA_SUMMARY, LOG_TEMPLATES, LogLevel, METRICS, SERVICES, THROUGHPUT } from './dashboard.data';

interface LogLine {
  id: number;
  time: Date;
  level: LogLevel;
  source: string;
  message: string;
}

const LOG_INTERVAL_MS = 3000;
const LOG_HISTORY = 200;

@Component({
  selector: 'app-dashboard',
  imports: [BadgeComponent, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements AfterViewChecked {
  protected readonly metrics = METRICS;
  protected readonly services = SERVICES;
  protected readonly summary = DATA_SUMMARY;
  protected readonly lastUpdated = new Date();

  private readonly maxRequests = Math.max(...THROUGHPUT.map((d) => d.requests));
  protected readonly throughput = THROUGHPUT.map((d) => ({
    ...d,
    percent: Math.round((d.requests / this.maxRequests) * 100),
  }));

  protected readonly logs = signal<LogLine[]>([]);
  private readonly logViewport = viewChild<ElementRef<HTMLElement>>('logViewport');
  private nextLogId = 0;
  private stickToBottom = true;

  constructor() {
    const now = Date.now();
    for (let i = 6; i > 0; i--) {
      this.appendLog(new Date(now - i * LOG_INTERVAL_MS));
    }
    const timer = setInterval(() => this.appendLog(new Date()), LOG_INTERVAL_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  ngAfterViewChecked(): void {
    const el = this.logViewport()?.nativeElement;
    if (el && this.stickToBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }

  protected onLogScroll(el: HTMLElement): void {
    this.stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
  }

  private appendLog(time: Date): void {
    const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
    const line: LogLine = { id: this.nextLogId++, time, ...template };
    this.logs.update((lines) => [...lines, line].slice(-LOG_HISTORY));
  }
}
