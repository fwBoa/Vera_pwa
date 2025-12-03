import { Router, Request, Response } from 'express';
import multer from 'multer';
import { GeminiService } from '../services/gemini.service';

const router = Router();

// Configure Multer for memory storage (files are processed in memory)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB limit
    }
});

// Lazy load services to ensure env vars are loaded
let geminiService: GeminiService;

// POST /api/analyze/upload - Analyze Image/Audio/Video
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!geminiService) geminiService = new GeminiService();

        const file = (req as any).file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log(`[Multimodal API] Received file: ${file.originalname} (${file.mimetype})`);

        const text = await geminiService.analyzeFile(file.buffer, file.mimetype);

        res.json({
            success: true,
            text: text,
            type: 'file_analysis'
        });

    } catch (error: any) {
        console.error('[Multimodal API] Upload error:', error);
        res.status(500).json({ error: error.message || 'Failed to analyze file' });
    }
});

// POST /api/analyze/url - Scrape and extract text from URL
router.post('/url', async (req: Request, res: Response) => {
    try {
        if (!geminiService) geminiService = new GeminiService();

        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        console.log(`[Multimodal API] Received URL: ${url}`);

        // Use GeminiService which handles Puppeteer + Summarization
        const text = await geminiService.analyzeUrl(url);

        res.json({
            success: true,
            text: text,
            type: 'url_analysis'
        });

    } catch (error: any) {
        console.error('[Multimodal API] URL error:', error);
        res.status(500).json({ error: error.message || 'Failed to analyze URL' });
    }
});

export default router;
