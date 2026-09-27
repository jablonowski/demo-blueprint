import { Component, Input } from '@angular/core';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';

export interface ServiceStatus {
  name: string;
  status: 'Online' | 'Offline';
}

@Component({
  selector: 'app-service-health',
  standalone: true,
  imports: [BadgeComponent],
  template: `
    <div class="ui-card service-health">
      <div class="ui-card__header">
        <span class="ui-card__title">Service Health</span>
      </div>
      <div class="service-health__list">
        @for (service of services; track service.name) {
          <div class="service-health__row">
            <span class="service-health__name">{{ service.name }}</span>
            <ui-badge [tone]="service.status === 'Online' ? 'positive' : 'negative'">{{
              service.status
            }}</ui-badge>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './service-health.component.css'
})
export class ServiceHealthComponent {
  @Input({ required: true }) services!: ServiceStatus[];
}
