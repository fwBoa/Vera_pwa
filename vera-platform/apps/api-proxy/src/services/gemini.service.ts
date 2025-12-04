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
     * Handles YouTube videos specifically by fetching transcripts
     */
    async analyzeUrl(url: string): Promise<string> {
        try {
            console.log(`[GeminiService] Fetching URL: ${url}`);

            // Check if it's a YouTube URL
            const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

            if (isYouTube) {
                console.log('[GeminiService] Detected YouTube URL, attempting to fetch transcript...');
                try {
                    const { YoutubeTranscript } = require('youtube-transcript');
                    const transcriptItems = await YoutubeTranscript.fetchTranscript(url);

                    const transcriptText = transcriptItems.map((item: any) => item.text).join(' ');
                    console.log(`[GeminiService] Fetched transcript (${transcriptText.length} chars). Sending to Gemini...`);

                    const prompt = `Voici la transcription d'une vidéo YouTube. Analyse-la pour du fact-checking. Extrais les faits principaux, le contexte et les affirmations clés.\n\nTranscription:\n${transcriptText.substring(0, 30000)}`;

                    const result = await this.model.generateContent(prompt);
                    return result.response.text();

                } catch (ytError: any) {
                    console.warn('[GeminiService] Failed to fetch YouTube transcript:', ytError.message);
                    console.log('[GeminiService] Falling back to standard page analysis...');
                    // Fallback to standard axios if transcript fails (e.g. no captions)
                }
            }

            // Standard Axios fetching for non-YouTube or fallback
            const axios = require('axios');
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 30000,
                maxRedirects: 5
            });

            const html = response.data;

            // Basic HTML cleaning
            let cleanText = html
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                .replace(/<!--[\s\S]*?-->/g, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/\s+/g, ' ')
                .trim();

            console.log(`[GeminiService] Extracted ${cleanText.length} characters. Sending to Gemini for analysis...`);

            const contentToAnalyze = cleanText.substring(0, 30000);
            const prompt = `Voici le contenu d'une page web. Extrais les faits principaux, le contexte et les affirmations clés pour du fact-checking. Ignore le bruit.\n\nContenu:\n${contentToAnalyze}`;

            const result = await this.model.generateContent(prompt);
            return result.response.text();

        } catch (error: any) {
            console.error('[GeminiService] Error analyzing URL:', error);
            throw new Error(`URL analysis failed: ${error.message}`);
        }
    }
}
