import { Component, Input } from '@angular/core';
import { TagComponent } from '@jablonowski/dsb-components';

@Component({
  selector: 'app-metric-tile',
  standalone: true,
  imports: [TagComponent],
  templateUrl: './metric-tile.component.html',
  styleUrl: './metric-tile.component.css'
})
export class MetricTileComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) value = '';
  @Input() trend = '';
  @Input() trendPositive = true;
  @Input() subLabel = '';
}
