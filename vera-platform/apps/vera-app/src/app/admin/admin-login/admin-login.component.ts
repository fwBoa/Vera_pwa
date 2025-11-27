import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-admin-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
    templateUrl: './admin-login.html',
    styleUrls: ['./admin-login.css'],
})
export class AdminLoginComponent {
    loginForm: FormGroup;
    errorMessage: string = '';

    constructor(
        private fb: FormBuilder,
        private http: HttpClient,
        private router: Router,
        private authService: AuthService
    ) {
        this.loginForm = this.fb.group({
            username: ['', Validators.required],
            password: ['', Validators.required],
        });
    }

    onSubmit() {
        if (this.loginForm.valid) {
            this.http.post<{ token: string }>('/api/auth/login', this.loginForm.value).subscribe({
                next: (response) => {
                    this.authService.setToken(response.token);
                    this.router.navigate(['/fact-check']);
                },
                error: (err) => {
                    this.errorMessage = 'Invalid credentials';
                },
            });
        }
    }
}
