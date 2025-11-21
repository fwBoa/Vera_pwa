import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

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

    constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
        this.loginForm = this.fb.group({
            username: ['', Validators.required],
            password: ['', Validators.required],
        });
    }

    onSubmit() {
        if (this.loginForm.valid) {
            this.http.post<{ token: string }>('/api/auth/login', this.loginForm.value).subscribe({
                next: (response) => {
                    localStorage.setItem('token', response.token);
                    this.router.navigate(['/admin/dashboard']); // We will create this next
                },
                error: (err) => {
                    this.errorMessage = 'Invalid credentials';
                },
            });
        }
    }
}
