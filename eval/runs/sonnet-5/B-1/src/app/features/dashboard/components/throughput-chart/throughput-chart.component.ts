import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface DayBar {
  label: string;
  value: number;
}

@Component({
  selector: 'app-throughput-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './throughput-chart.component.html',
  styleUrl: './throughput-chart.component.css',
})
export class ThroughputChartComponent {
  readonly bars: DayBar[] = [
    { label: 'Mon', value: 420 },
    { label: 'Tue', value: 512 },
    { label: 'Wed', value: 480 },
    { label: 'Thu', value: 610 },
    { label: 'Fri', value: 705 },
    { label: 'Sat', value: 380 },
    { label: 'Sun', value: 290 },
  ];

  readonly max = Math.max(...this.bars.map((bar) => bar.value));

  heightPercent(value: number): number {
    return Math.round((value / this.max) * 100);
  }
}
