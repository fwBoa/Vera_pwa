import { Component, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
    selectedFile: { name: string; type: string } | null = null;
    pendingFile: File | null = null;
    isRecording = false;
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private subscription?: Subscription;

    // Link previews
    linkPreviews: any[] = [];
    private processedUrls: Set<string> = new Set();

    constructor(
        private fb: FormBuilder,
        private factCheckService: FactCheckService,
        private authService: AuthService,
        private router: Router,
        private cd: ChangeDetectorRef
    ) {
        this.factCheckForm = this.fb.group({
            query: ['', [Validators.required, Validators.minLength(3)]],
        });
    }

    async onSubmit() {
        if (this.factCheckForm.invalid && !this.pendingFile) {
            return;
        }

        const query = this.factCheckForm.value.query;

        // If there's a pending file, analyze it first
        if (this.pendingFile) {
            await this.analyzeFile(this.pendingFile, query);
            return;
        }

        // Check for URL in query
        const urlRegex = /(https?:\/\/[^\s]+)/;
        const match = query.match(urlRegex);

        if (match) {
            await this.handleUrlAnalysis(match[0], query);
            return;
        }

        this.startFactCheck(query);
    }

    private isUrl(text: string): boolean {
        try {
            new URL(text);
            return true;
        } catch {
            return false;
        }
    }

    private async handleUrlAnalysis(url: string, originalQuery: string) {
        this.isLoading = true;
        this.errorMessage = '';
        this.result = 'Analyse de l\'URL en cours...';

        try {
            const text = await this.factCheckService.analyzeUrl(url);
            // Replace URL with extracted text and combine with original query
            const combinedQuery = originalQuery.replace(url, `\n\n[Contenu analysé de l'URL : ${text}]\n\n`);
            this.startFactCheck(combinedQuery);
        } catch (error: any) {
            this.isLoading = false;
            this.errorMessage = error.message || 'Erreur lors de l\'analyse de l\'URL';
            this.result = '';
        }
    }

    async onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];

            // Store file for later analysis
            this.pendingFile = file;

            // Store file info for preview
            this.selectedFile = {
                name: file.name,
                type: file.type
            };

            // Clear any previous results
            this.result = '';
            this.errorMessage = '';

            // Reset input
            input.value = '';
        }
    }

    private async analyzeFile(file: File, userQuery: string) {
        this.isLoading = true;
        this.errorMessage = '';
        this.result = 'Analyse du fichier en cours...';
        this.linkPreviews = [];
        this.processedUrls.clear();

        try {
            const text = await this.factCheckService.uploadFile(file);

            const combinedQuery = userQuery
                ? `Question de l'utilisateur : "${userQuery}"\n\nContexte analysé du fichier :\n${text}`
                : `Contexte analysé du fichier :\n${text}`;

            this.pendingFile = null;
            this.selectedFile = null; // Clear the file preview
            this.startFactCheck(combinedQuery);
        } catch (error: any) {
            this.isLoading = false;
            this.errorMessage = error.message || 'Erreur lors de l\'analyse du fichier';
            this.result = '';
        }
    }

    removeFile() {
        this.selectedFile = null;
        this.pendingFile = null;
        this.factCheckForm.patchValue({ query: '' });
    }

    triggerFileUpload() {
        const fileInput = document.getElementById('fileInputDesktop') as HTMLInputElement || document.getElementById('fileInputMobile') as HTMLInputElement;
        if (fileInput) {
            fileInput.click();
        }
    }

    async toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    private async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

                this.pendingFile = audioFile;
                this.selectedFile = {
                    name: 'Enregistrement vocal',
                    type: 'audio/webm'
                };

                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());

                // Force UI update
                this.cd.detectChanges();

                // Auto-submit the recording
                this.onSubmit();
            };

            this.mediaRecorder.start();
            this.isRecording = true;
        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.errorMessage = 'Impossible d\'accéder au microphone. Veuillez vérifier vos permissions.';
        }
    }

    private stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
        }
    }

    private startFactCheck(query: string) {
        // Utiliser le userId authentifié ou "guest" par défaut
        const userId = this.authService.getUserId() || 'guest';

        this.linkPreviews = [];
        this.processedUrls.clear();
        this.isLoading = true;
        this.result = '';
        this.errorMessage = '';

        this.subscription = this.factCheckService
            .checkFact({ userId, query })
            .subscribe({
                next: (chunk) => {
                    // Append each chunk to the result
                    this.result += chunk;
                    this.extractLinks(this.result);
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

    private extractLinks(text: string) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = text.match(urlRegex);

        if (matches) {
            matches.forEach(url => {
                // Clean URL (remove trailing punctuation often caught by regex)
                const cleanUrl = url.replace(/[.,;)]$/, '');

                if (!this.processedUrls.has(cleanUrl)) {
                    this.processedUrls.add(cleanUrl);
                    this.fetchMetadata(cleanUrl);
                }
            });
        }
    }

    private async fetchMetadata(url: string) {
        try {
            const response = await fetch(`http://localhost:3000/api/metadata?url=${encodeURIComponent(url)}`);
            const metadata = await response.json();

            if (metadata.title || metadata.image) {
                this.linkPreviews.push(metadata);
                // Force update if needed, though Angular should handle array mutations
                this.cd.detectChanges();
            }
        } catch (error) {
            console.error('Error fetching metadata for', url, error);
        }
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
        this.selectedFile = null;
        this.pendingFile = null;
        this.linkPreviews = [];
        this.processedUrls.clear();
        this.factCheckForm.reset();
    }

    navigateToHowItWorks() {
        this.router.navigate(['/how-it-works']);
    }

    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }
}