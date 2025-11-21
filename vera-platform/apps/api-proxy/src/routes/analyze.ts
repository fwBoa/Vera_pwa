import { Request, Response, Router } from 'express';
import axios from 'axios';

const router = Router();

router.post('/analyze', async (req: Request, res: Response) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const apiUrl = process.env.X_API_URL;
  const apiKey = process.env.X_API_KEY;

  if (!apiUrl || !apiKey) {
    console.error('Missing configuration: X_API_URL or X_API_KEY');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const response = await axios.post(
      `${apiUrl}/analyze`, // Assuming the endpoint is /analyze, adjusting if needed based on VERA API
      { url },
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Upstream API error:', error.message);
      const status = error.response?.status || 502;
      return res.status(status).json({
        error: 'Error communicating with VERA API',
        details: error.response?.data,
      });
    }
    console.error('Unknown error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
