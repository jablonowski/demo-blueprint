import { NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TagComponent } from '@jablonowski/dsb-components';

@Component({
  selector: 'app-metric-tile',
  standalone: true,
  imports: [NgIf, TagComponent],
  template: `
    <div class="metric-tile">
      <span class="metric-title">{{ title }}</span>
      <div class="metric-value-row">
        <span class="metric-value">{{ value }}</span>
        <dsb-tag *ngIf="trend" [variant]="positive ? 'success' : 'warning'" size="sm">{{ trend }}</dsb-tag>
      </div>
      <span class="metric-sublabel" *ngIf="subLabel">{{ subLabel }}</span>
    </div>
  `,
  styles: [
    `
      .metric-tile {
        display: flex;
        flex-direction: column;
        gap: var(--ds-decisions-space-sm);
        padding: var(--ds-decisions-space-2xl);
        background: var(--ds-decisions-color-surface-base);
        border: var(--ds-decisions-border-width-hairline) solid var(--ds-decisions-color-border-subtle);
        border-radius: var(--ds-decisions-border-radius-xl);
      }

      .metric-title {
        font-size: var(--ds-decisions-font-size-2xs);
        font-weight: var(--ds-decisions-font-weight-semibold);
        text-transform: uppercase;
        letter-spacing: var(--ds-decisions-font-tracking-caps);
        color: var(--ds-decisions-color-text-subtle);
      }

      .metric-value-row {
        display: flex;
        align-items: center;
        gap: var(--ds-decisions-space-sm);
      }

      .metric-value {
        font-size: var(--ds-decisions-font-size-3xl);
        font-weight: var(--ds-decisions-font-weight-semibold);
        color: var(--ds-decisions-color-text-primary);
        line-height: var(--ds-decisions-font-line-height-none);
      }

      .metric-sublabel {
        font-size: var(--ds-decisions-font-size-xs);
        color: var(--ds-decisions-color-text-subtle);
      }
    `,
  ],
})
export class MetricTileComponent {
  @Input() title = '';
  @Input() value = '';
  @Input() trend = '';
  @Input() positive = true;
  @Input() subLabel = '';
}
