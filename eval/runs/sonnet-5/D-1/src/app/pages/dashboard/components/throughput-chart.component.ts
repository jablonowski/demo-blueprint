import { Component } from '@angular/core';

interface DayValue {
  label: string;
  value: number;
}

@Component({
  selector: 'app-throughput-chart',
  standalone: true,
  templateUrl: './throughput-chart.component.html',
  styleUrl: './throughput-chart.component.css'
})
export class ThroughputChartComponent {
  readonly data: DayValue[] = [
    { label: 'Mon', value: 3120 },
    { label: 'Tue', value: 3860 },
    { label: 'Wed', value: 4420 },
    { label: 'Thu', value: 4180 },
    { label: 'Fri', value: 4820 },
    { label: 'Sat', value: 2640 },
    { label: 'Sun', value: 2110 }
  ];

  readonly maxValue = Math.max(...this.data.map((d) => d.value));

  heightPercent(value: number): number {
    return Math.round((value / this.maxValue) * 100);
  }
}
