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
     * Analyze a URL directly with Gemini (no scraping needed)
     */
    async analyzeUrl(url: string): Promise<string> {
        try {
            console.log(`[GeminiService] Analyzing URL with Gemini: ${url}`);

            const prompt = `Analyse cette page web pour du fact-checking. Extrais les faits principaux, le contexte et les affirmations clés. Ignore les éléments non-pertinents (menus, publicités, etc.).\n\nURL: ${url}`;

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
