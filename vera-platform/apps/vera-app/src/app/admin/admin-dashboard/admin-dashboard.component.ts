import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './admin-dashboard.html',
    styleUrls: ['./admin-dashboard.css'],
})
export class AdminDashboardComponent {
    constructor(private authService: AuthService) { }

    logout() {
        this.authService.logout();
    }
}
