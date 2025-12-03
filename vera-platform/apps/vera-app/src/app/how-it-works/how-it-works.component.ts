import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
    selector: 'app-how-it-works',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './how-it-works.component.html',
    styleUrls: ['./how-it-works.component.css'],
})
export class HowItWorksComponent {
    constructor(private router: Router) { }

    navigateToHome() {
        this.router.navigate(['/']);
    }
}
