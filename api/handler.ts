import { handleApiRequest } from '../src/lib/api-handlers';

export default async function handler(req: any, res: any) {
  const handled = await handleApiRequest(req, res);

  if (!handled && !res.writableEnded) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'API route not found' }));
  }
}
