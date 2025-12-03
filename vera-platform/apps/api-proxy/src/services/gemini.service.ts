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
     * Analyze a URL by scraping its content and processing it with Gemini
     */
    async analyzeUrl(url: string): Promise<string> {
        try {
            console.log(`[GeminiService] Scraping URL: ${url}`);

            // Lazy load puppeteer to avoid startup overhead if not used
            const puppeteer = require('puppeteer');

            const browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();

            // Set a realistic user agent
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            // Extract main text content
            const pageText = await page.evaluate(() => {
                // Remove scripts, styles, and other non-content elements
                const scripts = document.querySelectorAll('script, style, nav, footer, iframe, noscript');
                scripts.forEach(script => script.remove());
                return document.body.innerText;
            });

            await browser.close();

            console.log(`[GeminiService] Scraped ${pageText.length} characters. Sending to Gemini for summarization...`);

            const prompt = `Voici le contenu brut d'une page web. Extrais les faits principaux, le contexte et les affirmations clés pour une vérification des faits (fact-checking). Ignore le bruit (menus, pubs). \n\nContenu:\n${pageText.substring(0, 30000)}`; // Limit context window

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
