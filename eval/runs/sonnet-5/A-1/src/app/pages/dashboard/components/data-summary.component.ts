import { Component, Input } from '@angular/core';

export interface DataSummaryItem {
  label: string;
  value: string;
}

@Component({
  selector: 'app-data-summary',
  standalone: true,
  template: `
    <div class="ui-card data-summary">
      <div class="ui-card__header">
        <span class="ui-card__title">Data Summary</span>
      </div>
      <div class="data-summary__list">
        @for (item of items; track item.label) {
          <div class="data-summary__row">
            <span class="data-summary__label">{{ item.label }}</span>
            <span class="data-summary__value">{{ item.value }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './data-summary.component.css'
})
export class DataSummaryComponent {
  @Input({ required: true }) items!: DataSummaryItem[];
}
