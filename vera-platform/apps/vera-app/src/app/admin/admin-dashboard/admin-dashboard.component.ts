import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './admin-dashboard.html',
    styleUrls: ['./admin-dashboard.css'],
})
export class AdminDashboardComponent {
    constructor(private router: Router) { }

    logout() {
        localStorage.removeItem('token');
        this.router.navigate(['/admin/login']);
    }
}
