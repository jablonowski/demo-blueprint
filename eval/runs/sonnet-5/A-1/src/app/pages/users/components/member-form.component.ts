import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-member-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="member-form" [formGroup]="group">
      <div class="field-row">
        <div class="field">
          <label class="field__label" for="firstName">First name</label>
          <input id="firstName" class="field__control" formControlName="firstName" placeholder="Jane" />
        </div>
        <div class="field">
          <label class="field__label" for="lastName">Last name</label>
          <input id="lastName" class="field__control" formControlName="lastName" placeholder="Doe" />
        </div>
      </div>

      <div class="field">
        <label class="field__label" for="email">Email address</label>
        <input
          id="email"
          type="email"
          class="field__control"
          formControlName="email"
          placeholder="jane.doe@example.com"
        />
      </div>

      <div class="field">
        <label class="field__label" for="role">Role</label>
        <select id="role" class="field__control" formControlName="role">
          @if (rolePlaceholder) {
            <option value="" disabled>{{ rolePlaceholder }}</option>
          }
          <option value="Admin">Admin</option>
          <option value="Editor">Editor</option>
          <option value="Viewer">Viewer</option>
        </select>
      </div>
    </div>
  `,
  styleUrl: './member-form.component.css'
})
export class MemberFormComponent {
  @Input({ required: true }) group!: FormGroup;
  @Input() rolePlaceholder?: string;
}
