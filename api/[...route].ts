import 'dotenv/config';
import { handleApiRequest } from '../src/lib/api-handlers';

export default async function handler(req: any, res: any) {
  await handleApiRequest(req, res);
}
