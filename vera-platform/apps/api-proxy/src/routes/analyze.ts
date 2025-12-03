import { Request, Response, Router } from 'express';
import axios from 'axios';
import multer from 'multer';
import { GeminiService } from '../services/gemini.service';

const router = Router();
// File upload and URL analysis are handled in multimodal.ts

router.post('/analyze', async (req: Request, res: Response) => {
  const { userId, query } = req.body;

  // Validate request body
  if (!userId || !query) {
    return res.status(400).json({ error: 'userId and query are required' });
  }

  const apiUrl = process.env.VERA_API_URL;
  const apiKey = process.env.VERA_API_KEY;

  console.log('[Analyze] Request received');
  console.log('[Analyze] VERA_API_URL:', apiUrl);
  console.log('[Analyze] VERA_API_KEY:', apiKey ? 'Present' : 'Missing');

  if (!apiUrl || !apiKey) {
    console.error('Missing configuration: VERA_API_URL or VERA_API_KEY');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Make request to Vera API with streaming response
    const response = await axios.post(
      apiUrl,
      { userId, query },
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        responseType: 'stream', // Enable streaming
      }
    );

    // Set headers for streaming text response
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Pipe the streaming response directly to the client
    response.data.pipe(res);

    // Accumulate response for saving to Supabase
    let fullResponse = '';
    response.data.on('data', (chunk: Buffer) => {
      fullResponse += chunk.toString();
    });

    response.data.on('end', () => {
      console.log('[Analyze] Stream ended');
    });

    // Handle stream errors
    response.data.on('error', (error: Error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream error occurred' });
      }
    });

  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const statusMessages: Record<number, string> = {
        401: 'Missing or invalid API key',
        403: 'Partner account disabled',
        422: 'Invalid request body',
        429: 'Rate limit exceeded',
        500: 'Vera API internal server error',
      };

      console.error('Vera API error:', error.message, 'Status:', status);

      return res.status(status).json({
        error: statusMessages[status] || 'Error communicating with Vera API',
        details: error.response?.data,
      });
    }
    console.error('Unknown error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;
