import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-privacy',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './privacy.component.html',
    styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background-color: #FEF2E4; /* Vera Beige */
    }
  `]
})
export class PrivacyComponent { }
