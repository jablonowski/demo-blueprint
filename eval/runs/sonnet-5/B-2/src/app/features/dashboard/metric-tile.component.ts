import { Component, Input } from '@angular/core';
import { TagComponent } from '@jablonowski/dsb-components';

@Component({
  selector: 'app-metric-tile',
  standalone: true,
  imports: [TagComponent],
  template: `
    <div class="tile">
      <span class="tile-title">{{ title }}</span>
      <div class="tile-value-row">
        <span class="tile-value">{{ value }}</span>
        @if (trend) {
          <dsb-tag [variant]="trendPositive ? 'success' : 'danger'" size="sm">{{ trend }}</dsb-tag>
        }
      </div>
      @if (subLabel) {
        <span class="tile-sub">{{ subLabel }}</span>
      }
    </div>
  `,
  styleUrl: './metric-tile.component.css',
})
export class MetricTileComponent {
  @Input() title = '';
  @Input() value = '';
  @Input() trend = '';
  @Input() trendPositive = true;
  @Input() subLabel = '';
}
