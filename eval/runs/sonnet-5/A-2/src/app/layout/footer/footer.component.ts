import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  readonly year = new Date().getFullYear();

  readonly columns = [
    {
      title: 'Product',
      links: ['Overview', 'Dashboard', 'Team Members']
    },
    {
      title: 'Company',
      links: ['About', 'Careers', 'Contact']
    },
    {
      title: 'Resources',
      links: ['Documentation', 'Support', 'Status']
    }
  ];

  readonly legalLinks = ['Privacy Policy', 'Terms of Service', 'Cookie Settings'];
}
