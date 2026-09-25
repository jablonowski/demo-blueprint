import { Component, Input } from '@angular/core';
import { Tone } from '../../core/models/user.model';

@Component({
  selector: 'app-badge',
  standalone: true,
  template: `<span class="badge" [class]="'badge--' + tone"><ng-content /></span>`,
  styleUrl: './badge.component.css'
})
export class BadgeComponent {
  @Input({ required: true }) tone: Tone = 'neutral';
}
