import { Component } from '@angular/core';

@Component({
  selector: 'app-shell',
  template: `
    <dsb-header [brandName]="brand" />
    <dsb-avatar name="Admin User" size="sm" />
    <dsb-footer
      [brandName]="brand"
      [columns]="footerColumns" />
    <router-outlet />
  `,
})
export class ShellComponent {}
