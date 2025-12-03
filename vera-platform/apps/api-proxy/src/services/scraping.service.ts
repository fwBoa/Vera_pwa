import puppeteer from 'puppeteer-core';

export class ScrapingService {

    /**
     * Extract main text content from a URL
     */
    async extractTextFromUrl(url: string): Promise<string> {
        console.log(`[ScrapingService] Scraping URL: ${url}`);
        let browser;
        try {
            // Launch browser
            // Note: In production (Vercel), we might need a specific setup or external service
            // For local dev, this works if Chrome is installed or puppeteer downloads it
            // Using 'puppeteer' package handles download, 'puppeteer-core' needs executablePath

            // We installed 'puppeteer' which includes the browser, so we should import 'puppeteer' not 'core'
            // But for Vercel size limits, we usually use 'puppeteer-core' + 'chrome-aws-lambda'
            // For this MVP, let's try standard puppeteer first
            const puppeteerLib = require('puppeteer');

            browser = await puppeteerLib.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();

            // Set user agent to avoid basic bot detection
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

            await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

            // Simple text extraction
            // In a real app, we might use @mozilla/readability here
            const text = await page.evaluate(() => {
                // Remove scripts, styles, etc.
                const scripts = document.querySelectorAll('script, style, nav, footer, iframe');
                scripts.forEach(script => script.remove());

                return document.body.innerText;
            });

            console.log(`[ScrapingService] Extracted ${text.length} characters`);
            return text;

        } catch (error: any) {
            console.error('[ScrapingService] Error scraping URL:', error);
            throw new Error(`Failed to scrape URL: ${error.message}`);
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
}
