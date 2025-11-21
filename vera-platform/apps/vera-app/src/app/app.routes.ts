import { Route } from '@angular/router';
import { AdminLoginComponent } from './admin/admin-login/admin-login.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { authGuard } from './admin/auth.guard';

export const appRoutes: Route[] = [
    { path: 'admin/login', component: AdminLoginComponent },
    {
        path: 'admin/dashboard',
        component: AdminDashboardComponent,
        canActivate: [authGuard]
    },
    { path: '', redirectTo: 'admin/login', pathMatch: 'full' }, // Temporary redirect
];
