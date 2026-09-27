import { Directive, HostBinding, Input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'destructive-outline' | 'ghost';
export type ButtonSize = 'sm' | 'md';

@Directive({
  selector: '[uiButton]',
  standalone: true
})
export class ButtonDirective {
  @Input() variant: ButtonVariant = 'secondary';
  @Input() size: ButtonSize = 'md';

  @HostBinding('class')
  get hostClass(): string {
    return `ui-btn ui-btn--${this.variant} ui-btn--${this.size}`;
  }
}
