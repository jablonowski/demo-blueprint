import { Component } from '@angular/core';

@Component({
  selector: 'app-throughput-chart',
  standalone: true,
  template: `
    <div class="chart-wrap">
      @for (bar of bars; track bar.day) {
        <div class="bar-col">
          <div class="bar" [style.height.%]="bar.height"></div>
          <span class="bar-label">{{ bar.day }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .chart-wrap { display: flex; align-items: flex-end; gap: 6px; height: 80px; padding-top: 4px; }
    .bar-col    { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; height: 100%; justify-content: flex-end; }
    .bar        { width: 100%; background-color: #000000; border-radius: 2px 2px 0 0; min-height: 4px; }
    .bar-label  { font-size: 11px; color: var(--ds-decisions-color-text-secondary, #999); }
  `]
})
export class ThroughputChartComponent {
  bars = [
    { day: 'Mon', height: 60 }, { day: 'Tue', height: 80 },
    { day: 'Wed', height: 55 }, { day: 'Thu', height: 90 },
    { day: 'Fri', height: 70 }, { day: 'Sat', height: 45 },
    { day: 'Sun', height: 65 }
  ];
}
