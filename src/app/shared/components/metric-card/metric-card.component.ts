import { Component, Input } from '@angular/core';
import { TagComponent } from '@jablonowski/dsb-components';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [TagComponent],
  template: `
    <div class="metric-card">
      <div class="metric-header">
        <span class="metric-title">{{ title }}</span>
        @if (trend && trendVariant) {
          <dsb-tag [variant]="trendVariant" size="sm">{{ trend }}</dsb-tag>
        }
      </div>
      @if (value) {
        <div class="metric-value">{{ value }}</div>
      }
      @if (subLabel) {
        <div class="metric-sub">{{ subLabel }}</div>
      }
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .metric-card {
      background: var(--ds-decisions-color-surface-card, #ffffff);
      border: 1px solid var(--ds-decisions-color-border-subtle, #e5e5e5);
      border-radius: 8px; padding: 20px; display: flex; flex-direction: column;
      gap: 8px; height: 100%;
    }
    .metric-header { display: flex; align-items: center; justify-content: space-between; }
    .metric-title  { font-size: 13px; font-weight: 500; color: var(--ds-decisions-color-text-secondary, #666); }
    .metric-value  { font-size: 28px; font-weight: 600; color: var(--ds-decisions-color-text-primary, #111); line-height: 1.2; }
    .metric-sub    { font-size: 12px; color: var(--ds-decisions-color-text-secondary, #666); }
  `]
})
export class MetricCardComponent {
  @Input() title = '';
  @Input() value = '';
  @Input() trend: string | null = null;
  @Input() trendVariant: 'success' | 'warning' | 'danger' | 'info' | 'default' | null = null;
  @Input() subLabel: string | null = null;
}
