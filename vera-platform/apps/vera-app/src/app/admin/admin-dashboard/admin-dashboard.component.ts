import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { SurveyService, SurveyStats } from '../../services/survey.service';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables, ChartConfiguration, ChartData } from 'chart.js';

Chart.register(...registerables);

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, BaseChartDirective, HttpClientModule],
    templateUrl: './admin-dashboard.html',
    styleUrls: ['./admin-dashboard.css'],
})
export class AdminDashboardComponent implements OnInit {
    stats: SurveyStats | null = null;
    loading = true;
    error: string | null = null;

    // Chart Configuration
    public barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
            },
            title: {
                display: true,
                text: 'Réponses au Sondage'
            }
        }
    };
    public barChartType: ChartConfiguration['type'] = 'bar';
    public barChartData: ChartData<'bar'> = {
        labels: [],
        datasets: [
            { data: [], label: 'Réponses', backgroundColor: '#98FB98', hoverBackgroundColor: '#006400' }
        ]
    };

    constructor(
        private router: Router,
        private surveyService: SurveyService
    ) { }

    ngOnInit() {
        this.loadStats();
        // Refresh every 30 seconds
        setInterval(() => this.loadStats(), 30000);
    }

    loadStats() {
        // Don't show loading spinner on refresh, only on first load
        const isFirstLoad = this.stats === null;
        if (!isFirstLoad) {
            this.loading = false;
        }

        this.surveyService.getStats().subscribe({
            next: (response) => {
                console.log('[Dashboard] Stats loaded:', response);
                if (response.success) {
                    this.stats = response.stats;
                    this.updateChart(response.stats);
                    this.error = null; // Clear any previous errors
                } else {
                    this.error = 'Réponse invalide du serveur.';
                }
                this.loading = false;
            },
            error: (err) => {
                console.error('[Dashboard] Error loading stats:', err);
                this.error = `Impossible de charger les données: ${err.message || 'Erreur réseau'}`;
                this.loading = false;
            }
        });
    }

    updateChart(stats: SurveyStats) {
        // Example: Count responses per column (simplified logic for demo)
        // In a real scenario, we would process specific questions
        // Here we just show total responses as a single bar for now, 
        // or we could try to parse the sample data if we knew the structure.

        // Let's try to visualize the first question if possible, or just a dummy chart for now
        // based on the "totalResponses"

        this.barChartData = {
            labels: ['Total Réponses'],
            datasets: [
                {
                    data: [stats.totalResponses],
                    label: 'Nombre de participants',
                    backgroundColor: ['#D8B4FE'], // Vera Purple
                    borderColor: ['#7E22CE'],
                    borderWidth: 1
                }
            ]
        };
    }

    logout() {
        localStorage.removeItem('token');
        this.router.navigate(['/admin/login']);
    }
}
