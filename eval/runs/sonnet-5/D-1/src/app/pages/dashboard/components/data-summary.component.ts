import { Component } from '@angular/core';

interface SummaryItem {
  label: string;
  value: string;
}

@Component({
  selector: 'app-data-summary',
  standalone: true,
  templateUrl: './data-summary.component.html',
  styleUrl: './data-summary.component.css'
})
export class DataSummaryComponent {
  readonly items: SummaryItem[] = [
    { label: 'Requests/min', value: '4,820' },
    { label: 'Avg Response', value: '142 ms' },
    { label: 'Error Rate', value: '0.04%' },
    { label: 'Uptime (30d)', value: '99.97%' }
  ];
}
