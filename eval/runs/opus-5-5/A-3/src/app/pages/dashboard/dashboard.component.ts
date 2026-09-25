import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { BadgeComponent } from '../../shared/badge.component';
import { LOG_TEMPLATES, LogLine, METRICS, SERVICES, SUMMARY, THROUGHPUT } from './dashboard.data';

const LOG_INTERVAL_MS = 3000;
const LOG_BUFFER = 200;

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  protected readonly metrics = METRICS;
  protected readonly services = SERVICES;
  protected readonly summary = SUMMARY;

  private readonly peak = Math.max(...THROUGHPUT.map((p) => p.requests));
  protected readonly bars = THROUGHPUT.map((p) => ({
    ...p,
    percent: Math.round((p.requests / this.peak) * 100),
  }));

  protected readonly logs = signal<LogLine[]>([]);
  private readonly logViewport = viewChild.required<ElementRef<HTMLElement>>('logViewport');
  private nextLogId = 0;

  constructor() {
    // Seed a few lines so the viewer is not empty on first paint.
    const now = Date.now();
    this.logs.set([5, 4, 3, 2, 1].map((n) => this.makeLog(new Date(now - n * LOG_INTERVAL_MS))));

    const timer = setInterval(() => {
      this.logs.update((lines) => [...lines, this.makeLog(new Date())].slice(-LOG_BUFFER));
    }, LOG_INTERVAL_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));

    // Keep the newest line in view.
    afterRenderEffect(() => {
      this.logs();
      const el = this.logViewport().nativeElement;
      el.scrollTop = el.scrollHeight;
    });
  }

  private makeLog(at: Date): LogLine {
    const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
    return { id: this.nextLogId++, time: at.toTimeString().slice(0, 8), ...template };
  }
}
