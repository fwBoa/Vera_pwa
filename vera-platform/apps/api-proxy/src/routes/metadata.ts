import express from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/metadata', async (req, res) => {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; VeraBot/1.0; +http://vera.ai)',
            },
            timeout: 5000, // 5 seconds timeout
        });

        const html = response.data;

        // Simple regex to extract OG tags and title
        const getMetaTag = (name: string) => {
            const regex = new RegExp(`<meta\\s+(?:name|property)=["'](?:og:)?${name}["']\\s+content=["']([^"']+)["']`, 'i');
            const match = html.match(regex);
            return match ? match[1] : null;
        };

        const getTitle = () => {
            const regex = /<title[^>]*>([^<]+)<\/title>/i;
            const match = html.match(regex);
            return match ? match[1] : null;
        };

        const title = getMetaTag('title') || getTitle() || '';
        const description = getMetaTag('description') || '';
        const image = getMetaTag('image') || '';
        const domain = new URL(url).hostname.replace('www.', '');

        res.json({
            title,
            description,
            image,
            domain,
            url
        });
    } catch (error: any) {
        console.error('Error fetching metadata:', error.message);
        // Return a fallback instead of erroring out, so the frontend can still show a basic card
        res.json({
            title: '',
            description: '',
            image: '',
            domain: new URL(url).hostname.replace('www.', ''),
            url
        });
    }
});

export default router;
