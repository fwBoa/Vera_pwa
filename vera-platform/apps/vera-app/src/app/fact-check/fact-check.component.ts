import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FactCheckService } from '../services/fact-check.service';
import { AuthService } from '../services/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
    selector: 'app-fact-check',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './fact-check.html',
    styleUrls: ['./fact-check.css'],
})
export class FactCheckComponent implements OnDestroy {
    factCheckForm: FormGroup;
    isLoading = false;
    result = '';
    errorMessage = '';
    private subscription?: Subscription;

    constructor(
        private fb: FormBuilder,
        private factCheckService: FactCheckService,
        private authService: AuthService,
        private router: Router
    ) {
        this.factCheckForm = this.fb.group({
            query: ['', [Validators.required, Validators.minLength(3)]],
        });
    }

    onSubmit() {
        if (this.factCheckForm.invalid) {
            return;
        }

        // Utiliser le userId authentifié ou "guest" par défaut
        const userId = this.authService.getUserId() || 'guest';

        this.isLoading = true;
        this.result = '';
        this.errorMessage = '';

        const query = this.factCheckForm.value.query;

        this.subscription = this.factCheckService
            .checkFact({ userId, query })
            .subscribe({
                next: (chunk) => {
                    // Append each chunk to the result
                    this.result += chunk;
                },
                error: (err) => {
                    this.isLoading = false;
                    this.errorMessage = err.message || 'An error occurred';
                    console.error('Fact-check error:', err);
                },
                complete: () => {
                    this.isLoading = false;
                },
            });
    }

    logout() {
        this.authService.logout();
    }

    get isAuthenticated(): boolean {
        return this.authService.isAuthenticated();
    }

    clearResult() {
        this.result = '';
        this.errorMessage = '';
        this.factCheckForm.reset();
    }

    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }
}
