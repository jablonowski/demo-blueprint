import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-metric-tile',
  standalone: true,
  imports: [],
  templateUrl: './metric-tile.component.html',
  styleUrl: './metric-tile.component.scss'
})
export class MetricTileComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) value!: string;
  @Input() trend?: string;
  @Input() trendPositive = true;
  @Input() subLabel?: string;
}
