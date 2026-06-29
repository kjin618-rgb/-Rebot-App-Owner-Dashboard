import 'dotenv/config';
import express from 'express';
import path from 'path';
import { handleApiRequest } from './src/lib/api-handlers';

const app = express();
const PORT = 3000;

// API middleware routing
app.all('/api/*', async (req, res, next) => {
  const handled = await handleApiRequest(req, res);
  if (!handled) {
    next();
  }
});

// Serve static compiled assets from dist in production
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// Fallback all client router paths to index.html for SPA mode
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production full-stack server running on port ${PORT}`);
});
