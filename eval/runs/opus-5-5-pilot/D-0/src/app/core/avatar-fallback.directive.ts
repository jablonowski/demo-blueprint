import { ChangeDetectorRef, Directive, ElementRef, OnDestroy, inject } from '@angular/core';
import { AvatarComponent } from '@jablonowski/dsb-components';

/**
 * dsb-avatar falls back to initials only when `src` is empty. This clears `src` when
 * the image fails to load, so a broken URL also ends in initials.
 */
@Directive({ selector: 'dsb-avatar[appAvatarFallback]' })
export class AvatarFallbackDirective implements OnDestroy {
  private readonly avatar = inject(AvatarComponent);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly el: HTMLElement = inject(ElementRef).nativeElement;

  private readonly onError = (event: Event) => {
    if (event.target instanceof HTMLImageElement) {
      this.avatar.src = '';
      this.cdr.markForCheck();
    }
  };

  constructor() {
    // Image error events do not bubble, so listen in the capture phase.
    this.el.addEventListener('error', this.onError, true);
  }

  ngOnDestroy(): void {
    this.el.removeEventListener('error', this.onError, true);
  }
}
