import { Component, Input } from '@angular/core';

export interface ThroughputPoint {
  label: string;
  value: number;
}

@Component({
  selector: 'app-throughput-chart',
  standalone: true,
  template: `
    <div class="ui-card throughput">
      <div class="ui-card__header">
        <span class="ui-card__title">Request Throughput</span>
      </div>
      <div class="throughput__chart">
        @for (point of data; track point.label) {
          <div class="throughput__col">
            <div class="throughput__bar" [style.height.%]="percentOf(point.value)"></div>
            <span class="throughput__label">{{ point.label }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './throughput-chart.component.css'
})
export class ThroughputChartComponent {
  @Input({ required: true }) data!: ThroughputPoint[];

  percentOf(value: number): number {
    const max = Math.max(...this.data.map((d) => d.value), 1);
    return (value / max) * 100;
  }
}
