import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TagComponent } from '@jablonowski/dsb-components';

@Component({
  selector: 'app-stat-tile',
  standalone: true,
  imports: [CommonModule, TagComponent],
  templateUrl: './stat-tile.component.html',
  styleUrl: './stat-tile.component.css',
})
export class StatTileComponent {
  @Input() title = '';
  @Input() value = '';
  @Input() trend = '';
  @Input() trendPositive = true;
  @Input() subLabel = '';
}
