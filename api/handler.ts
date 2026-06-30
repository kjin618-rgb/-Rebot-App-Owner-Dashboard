import 'dotenv/config';
import { handleApiRequest } from '../src/lib/api-handlers';

export default async function handler(req: any, res: any) {
  // Debug endpoint: check what URL Vercel passes to this function
  if (req.url === '/api/debug' || req.url?.includes('/api/debug')) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      url: req.url,
      method: req.method,
      supabase_url_set: !!process.env.SUPABASE_URL,
      supabase_key_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      headers_relevant: {
        'x-vercel-id': req.headers['x-vercel-id'],
        'x-matched-path': req.headers['x-matched-path'],
        'x-forwarded-host': req.headers['x-forwarded-host'],
      },
    }));
    return;
  }

  try {
    const handled = await handleApiRequest(req, res);
    if (!handled) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'API route not found', url: req.url }));
    }
  } catch (err: any) {
    console.error('[Serverless] API error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message }));
  }
}
