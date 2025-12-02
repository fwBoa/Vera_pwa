import { Request, Response, Router } from 'express';
import axios from 'axios';

const router = Router();

router.post('/analyze', async (req: Request, res: Response) => {
  const { type, content, userId } = req.body;

  if (!type || !content || !userId) {
    return res
      .status(400)
      .json({ error: "Missing 'type', 'content', or 'userId'" });
  }

  const apiUrl = process.env.VERA_API_URL;
  const apiKey = process.env.VERA_API_KEY;

  if (!apiUrl || !apiKey) {
    console.error('❌ Missing configuration: VERA_API_URL or VERA_API_KEY');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Ce que Vera va recevoir comme texte
  let userMessage = '';

  switch (type) {
    case 'text':
      userMessage = content;
      break;

    case 'image':
      userMessage = `Analyse l'image suivante : ${content}`;
      break;

    case 'video':
      userMessage = `Analyse la vidéo suivante : ${content}`;
      break;

    case 'url':
      userMessage = `Analyse cette page : ${content}`;
      break;

    default:
      return res.status(400).json({ error: 'Unsupported type' });
  }

  const payload = {
    userId,
    query: userMessage,
  };

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      // IMPORTANT : on dit à axios de retourner le texte brut
      responseType: 'text',
    });

    return res.send(response.data);
  } catch (error: any) {
    console.error('❌ Vera API error:', error.message);
    return res.status(500).json({
      error: 'Error calling Vera API',
      details: error.response?.data || error.message,
    });
  }
});

export default router;
