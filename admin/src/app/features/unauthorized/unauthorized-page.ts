import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-unauthorized-page',
  imports: [ButtonModule, RouterLink],
  templateUrl: './unauthorized-page.html',
  styleUrl: './unauthorized-page.css',
})
export class UnauthorizedPage {}
