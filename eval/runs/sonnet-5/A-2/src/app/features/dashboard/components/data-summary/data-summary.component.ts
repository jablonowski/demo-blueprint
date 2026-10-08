import { Component } from '@angular/core';

interface SummaryRow {
  label: string;
  value: string;
}

@Component({
  selector: 'app-data-summary',
  standalone: true,
  imports: [],
  templateUrl: './data-summary.component.html',
  styleUrl: './data-summary.component.scss'
})
export class DataSummaryComponent {
  readonly rows: SummaryRow[] = [
    { label: 'Requests/min', value: '4,820' },
    { label: 'Avg Response', value: '142 ms' },
    { label: 'Error Rate', value: '0.04%' },
    { label: 'Uptime (30d)', value: '99.97%' }
  ];
}
