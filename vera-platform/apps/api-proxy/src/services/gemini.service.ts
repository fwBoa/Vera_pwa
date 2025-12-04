import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('[GeminiService] GEMINI_API_KEY is missing');
            throw new Error('GEMINI_API_KEY is required');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        // User requested gemini-2.0-flash
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        console.log('[GeminiService] Initialized with gemini-2.0-flash-exp');
    }

    /**
     * Analyze an image or audio file and return a description/transcription
     */
    async analyzeFile(fileBuffer: Buffer, mimeType: string): Promise<string> {
        try {
            console.log(`[GeminiService] Analyzing file (${mimeType})...`);

            let prompt = "Analyse ce fichier pour du fact-checking.";

            if (mimeType.startsWith('image/')) {
                prompt = "Décris cette image en détail pour vérifier les faits. Transcris tout texte visible et décris le contexte visuel.";
            } else if (mimeType.startsWith('audio/') || mimeType.startsWith('video/')) {
                prompt = "Transcris cet enregistrement fidèlement. Identifie les locuteurs si possible et décris le ton/contexte.";
            }

            const result = await this.model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: fileBuffer.toString("base64"),
                        mimeType
                    }
                }
            ]);

            const text = result.response.text();
            console.log('[GeminiService] Analysis complete');
            return text;
        } catch (error: any) {
            console.error('[GeminiService] Error analyzing file:', error);
            throw new Error(`Gemini analysis failed: ${error.message}`);
        }
    }

    /**
     * Analyze a URL by fetching its content and processing it with Gemini
     */
    async analyzeUrl(url: string): Promise<string> {
        try {
            console.log(`[GeminiService] Fetching URL: ${url}`);

            // Use axios to fetch the HTML content
            const axios = require('axios');
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 30000,
                maxRedirects: 5
            });

            const html = response.data;

            // Basic HTML cleaning - remove scripts, styles, and extract text
            // This is a simple regex-based approach that works reasonably well
            let cleanText = html
                // Remove script tags and their content
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                // Remove style tags and their content
                .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                // Remove HTML comments
                .replace(/<!--[\s\S]*?-->/g, '')
                // Remove all HTML tags
                .replace(/<[^>]+>/g, ' ')
                // Decode common HTML entities
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                // Normalize whitespace
                .replace(/\s+/g, ' ')
                .trim();

            console.log(`[GeminiService] Extracted ${cleanText.length} characters. Sending to Gemini for analysis...`);

            // Limit to avoid token limits
            const contentToAnalyze = cleanText.substring(0, 30000);

            const prompt = `Voici le contenu d'une page web. Extrais les faits principaux, le contexte et les affirmations clés pour une vérification des faits (fact-checking). Ignore le bruit (menus, pubs, etc.). \n\nContenu:\n${contentToAnalyze}`;

            const result = await this.model.generateContent(prompt);
            const text = result.response.text();

            console.log('[GeminiService] URL analysis complete');
            return text;

        } catch (error: any) {
            console.error('[GeminiService] Error analyzing URL:', error);
            throw new Error(`URL analysis failed: ${error.message}`);
        }
    }
}
