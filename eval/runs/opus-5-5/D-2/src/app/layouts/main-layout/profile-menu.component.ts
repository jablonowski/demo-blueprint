import { Component, ElementRef, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import { AvatarComponent } from '@jablonowski/dsb-components';

@Component({
  selector: 'app-profile-menu',
  imports: [AvatarComponent],
  templateUrl: './profile-menu.component.html',
  styleUrl: './profile-menu.component.css',
})
export class ProfileMenuComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  @Input() name = '';
  @Output() readonly signOut = new EventEmitter<void>();

  open = false;

  toggle(): void {
    this.open = !this.open;
  }

  close(): void {
    this.open = false;
  }

  onSignOut(): void {
    this.close();
    this.signOut.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }
}
