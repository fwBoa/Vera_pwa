import express from 'express';
import { GoogleSheetsService } from '../services/google-sheets.service';

const router = express.Router();
const googleSheetsService = new GoogleSheetsService();

// GET /api/survey/data - Fetch all survey data
router.get('/data', async (req, res) => {
    try {
        console.log('[Survey API] Fetching survey data...');
        const data = await googleSheetsService.getSurveyData();

        res.json({
            success: true,
            data,
            count: data.length
        });
    } catch (error: any) {
        console.error('[Survey API] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch survey data'
        });
    }
});

// GET /api/survey/stats - Get survey statistics
router.get('/stats', async (req, res) => {
    try {
        console.log('[Survey API] Calculating survey stats...');
        const stats = await googleSheetsService.getSurveyStats();

        res.json({
            success: true,
            stats
        });
    } catch (error: any) {
        console.error('[Survey API] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to calculate survey stats'
        });
    }
});

export default router;
