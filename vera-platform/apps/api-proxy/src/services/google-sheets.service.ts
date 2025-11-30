import { google } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';

interface SurveyRow {
    [key: string]: string;
}

export class GoogleSheetsService {
    private sheets;
    private spreadsheetId: string;
    private range: string;

    constructor() {
        try {
            // Debug environment variables
            console.log('[GoogleSheetsService] Initializing...');
            console.log('[GoogleSheetsService] GOOGLE_SHEETS_ID present:', !!process.env.GOOGLE_SHEETS_ID);
            console.log('[GoogleSheetsService] GOOGLE_CREDENTIALS present:', !!process.env.GOOGLE_CREDENTIALS);
            if (process.env.GOOGLE_CREDENTIALS) {
                console.log('[GoogleSheetsService] GOOGLE_CREDENTIALS length:', process.env.GOOGLE_CREDENTIALS.length);
            }

            let credentials;
            // Prioritize environment variable in production/Vercel
            if (process.env.GOOGLE_CREDENTIALS) {
                try {
                    credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
                    console.log('[GoogleSheetsService] Successfully parsed GOOGLE_CREDENTIALS from env');
                } catch (e) {
                    console.error('[GoogleSheetsService] Failed to parse GOOGLE_CREDENTIALS env var:', e);
                }
            }

            // Fallback to file if env var missing or failed
            if (!credentials) {
                const possiblePaths = [
                    path.join(__dirname, '../../google-credentials.json'),
                    path.join(process.cwd(), 'apps/api-proxy/google-credentials.json'),
                    path.join(process.cwd(), 'google-credentials.json')
                ];

                for (const p of possiblePaths) {
                    if (fs.existsSync(p)) {
                        console.log('[GoogleSheetsService] Found credentials file at:', p);
                        credentials = JSON.parse(fs.readFileSync(p, 'utf-8'));
                        break;
                    }
                }
            }

            if (!credentials) {
                console.error('[GoogleSheetsService] CRITICAL: No credentials found (Env var or File)');
                throw new Error('Google Credentials not found');
            }

            const auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
            });

            this.sheets = google.sheets({ version: 'v4', auth });
            this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '';
            this.range = process.env.SURVEY_SHEET_RANGE || 'Sheet1!A1:Z1000';

            console.log('[GoogleSheetsService] Service initialized successfully');
        } catch (error) {
            console.error('[GoogleSheetsService] Initialization error:', error);
            // Do not throw here to allow app to start, but subsequent calls will fail
            this.sheets = null;
        }
    }

    async getSurveyData(): Promise<SurveyRow[]> {
        try {
            // First, get the sheet name if we're using the default
            let range = this.range;
            if (range.startsWith('Sheet1!')) {
                try {
                    const metadata = await this.sheets.spreadsheets.get({
                        spreadsheetId: this.spreadsheetId
                    });
                    const sheets = metadata.data.sheets;
                    if (sheets && sheets.length > 0) {
                        const firstSheetTitle = sheets[0].properties?.title;
                        if (firstSheetTitle) {
                            // Replace Sheet1 with actual sheet title
                            range = range.replace('Sheet1', firstSheetTitle);
                            console.log(`[GoogleSheetsService] Detected sheet name: ${firstSheetTitle}, using range: ${range}`);
                        }
                    }
                } catch (metaError) {
                    console.warn('[GoogleSheetsService] Failed to fetch metadata, using default range:', metaError);
                }
            }

            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: range,
            });

            const rows = response.data.values;

            if (!rows || rows.length === 0) {
                console.log('[GoogleSheetsService] No data found');
                return [];
            }

            // First row is headers
            const headers = rows[0] as string[];
            const data = rows.slice(1);

            // Convert to array of objects
            const surveyData: SurveyRow[] = data.map((row: any[]) => {
                const obj: SurveyRow = {};
                headers.forEach((header, index) => {
                    obj[header] = row[index] || '';
                });
                return obj;
            });

            console.log(`[GoogleSheetsService] Retrieved ${surveyData.length} rows`);
            return surveyData;
        } catch (error: any) {
            console.error('[GoogleSheetsService] Error fetching data details:', {
                message: error.message,
                code: error.code,
                status: error.status,
                errors: error.errors
            });
            throw new Error(`Failed to fetch survey data: ${error.message}`);
        }
    }

    async getSurveyStats(): Promise<any> {
        try {
            const data = await this.getSurveyData();

            if (data.length === 0) {
                return {
                    totalResponses: 0,
                    lastUpdated: new Date().toISOString()
                };
            }

            // Calculate basic statistics
            const stats = {
                totalResponses: data.length,
                lastUpdated: new Date().toISOString(),
                columns: Object.keys(data[0]),
                sampleData: data.slice(0, 5) // First 5 rows as sample
            };

            return stats;
        } catch (error) {
            console.error('[GoogleSheetsService] Error calculating stats:', error);
            throw error;
        }
    }
}
