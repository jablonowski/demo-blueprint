import { Component } from '@angular/core';
import { DsbHeaderComponent, FooterColumn } from '@jablonowski/dsb-components';

@Component({
  selector: 'app-shell',
  template: `
    <dsb-header [brandName]="brand">
      <app-user-profile-menu />
    </dsb-header>
    <dsb-footer [columns]="footerColumns" />
  `,
})
export class ShellComponent {
  footerColumns: FooterColumn[] = [{ title: 'Product', links: [] }];
}
