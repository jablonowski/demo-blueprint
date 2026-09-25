import { Directive, ElementRef, OnDestroy, inject, output } from '@angular/core';

/**
 * dsb-avatar only falls back to initials when `src` is empty. `error` does not bubble,
 * so this listens in the capture phase and lets the host clear the source instead.
 */
@Directive({ selector: '[appImgError]' })
export class ImgErrorDirective implements OnDestroy {
  readonly appImgError = output<void>();

  private readonly el: HTMLElement = inject(ElementRef).nativeElement;
  private readonly listener = (event: Event) => {
    if (event.target instanceof HTMLImageElement) this.appImgError.emit();
  };

  constructor() {
    this.el.addEventListener('error', this.listener, true);
  }

  ngOnDestroy(): void {
    this.el.removeEventListener('error', this.listener, true);
  }
}
