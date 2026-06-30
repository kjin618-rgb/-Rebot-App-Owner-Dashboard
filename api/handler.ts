import { handleApiRequest } from '../src/lib/api-handlers';

export default async function handler(req: any, res: any) {
  // Debug endpoint
  if (req.url === '/api/debug' || req.url?.includes('/api/debug')) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      url: req.url,
      method: req.method,
      supabase_url_set: !!process.env.SUPABASE_URL,
      supabase_key_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
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
