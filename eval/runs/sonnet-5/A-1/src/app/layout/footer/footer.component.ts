import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  columns = [
    { title: 'Product', links: ['Dashboard', 'Team Members', 'Changelog'] },
    { title: 'Company', links: ['About', 'Careers', 'Contact'] },
    { title: 'Resources', links: ['Documentation', 'Support', 'Status'] }
  ];

  legalLinks = ['Privacy Policy', 'Terms of Service', 'Cookie Policy'];
}
