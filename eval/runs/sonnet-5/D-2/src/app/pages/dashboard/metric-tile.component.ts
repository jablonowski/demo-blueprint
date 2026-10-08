import { Component, Input } from '@angular/core';
import { TagComponent, TagVariant } from '@jablonowski/dsb-components';

@Component({
  selector: 'app-metric-tile',
  standalone: true,
  imports: [TagComponent],
  templateUrl: './metric-tile.component.html',
  styleUrl: './metric-tile.component.css',
})
export class MetricTileComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string;
  @Input() trend?: string;
  @Input() trendPositive = true;
  @Input() subLabel?: string;

  protected get trendVariant(): TagVariant {
    return this.trendPositive ? 'success' : 'danger';
  }
}
