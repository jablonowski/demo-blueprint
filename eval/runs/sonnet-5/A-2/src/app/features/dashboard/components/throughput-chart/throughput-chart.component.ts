import { Component } from '@angular/core';

interface DayBar {
  label: string;
  percent: number;
}

@Component({
  selector: 'app-throughput-chart',
  standalone: true,
  imports: [],
  templateUrl: './throughput-chart.component.html',
  styleUrl: './throughput-chart.component.scss'
})
export class ThroughputChartComponent {
  readonly bars: DayBar[] = [
    { label: 'Mon', percent: 62 },
    { label: 'Tue', percent: 78 },
    { label: 'Wed', percent: 55 },
    { label: 'Thu', percent: 90 },
    { label: 'Fri', percent: 100 },
    { label: 'Sat', percent: 40 },
    { label: 'Sun', percent: 33 }
  ];
}
