import { Component, Input } from '@angular/core';
import { initials } from '../../core/models/user.model';

@Component({
  selector: 'app-avatar',
  standalone: true,
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.css'
})
export class AvatarComponent {
  @Input({ required: true }) name = '';
  @Input() src: string | null = null;
  @Input() size = 32;

  imgFailed = false;

  get initials(): string {
    return initials(this.name);
  }

  onImgError(): void {
    this.imgFailed = true;
  }
}
