import { Component, Input } from '@angular/core';
import { BadgeComponent, BadgeTone } from '../../../shared/ui/badge/badge.component';

@Component({
  selector: 'app-metric-tile',
  standalone: true,
  imports: [BadgeComponent],
  template: `
    <div class="ui-card metric-tile">
      <span class="metric-tile__title">{{ title }}</span>
      <div class="metric-tile__value-row">
        <span class="metric-tile__value">{{ value }}</span>
        @if (trend) {
          <ui-badge [tone]="trendTone">{{ trend }}</ui-badge>
        }
      </div>
      @if (subLabel) {
        <span class="metric-tile__sublabel">{{ subLabel }}</span>
      }
    </div>
  `,
  styleUrl: './metric-tile.component.css'
})
export class MetricTileComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) value!: string;
  @Input() trend?: string;
  @Input() trendTone: BadgeTone = 'positive';
  @Input() subLabel?: string;
}
