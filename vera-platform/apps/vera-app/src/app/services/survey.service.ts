import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SurveyStats {
    totalResponses: number;
    lastUpdated: string;
    columns: string[];
    sampleData: any[];
}

@Injectable({
    providedIn: 'root'
})
export class SurveyService {
    private apiUrl = '/api/survey';

    constructor(private http: HttpClient) { }

    getStats(): Observable<{ success: boolean; stats: SurveyStats }> {
        return this.http.get<{ success: boolean; stats: SurveyStats }>(`${this.apiUrl}/stats`);
    }

    getData(): Observable<{ success: boolean; data: any[]; count: number }> {
        return this.http.get<{ success: boolean; data: any[]; count: number }>(`${this.apiUrl}/data`);
    }
}
