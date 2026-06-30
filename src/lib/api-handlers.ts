import url from 'url';
import {
  getStore,
  updateStore,
  getCustomers,
  getCustomerById,
  addStamp,
  recordManualVisit,
  getStoreMessages,
  addMessageDraft,
  patchMessage,
  deleteMessage,
  getSavedContentDrafts,
  saveContentDraft,
} from './db-server';
import { generateAIMessage, generateAIPost } from './ai-server';

function getRequestBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    // Vercel serverless functions pre-parse JSON bodies into req.body
    if (req.body !== undefined) {
      resolve(req.body);
      return;
    }
    let bodyStr = '';
    req.on('data', (chunk: any) => { bodyStr += chunk.toString(); });
    req.on('end', () => {
      try { resolve(bodyStr ? JSON.parse(bodyStr) : {}); }
      catch (e) { resolve({}); }
    });
  });
}

export async function handleApiRequest(req: any, res: any): Promise<boolean> {
  const parsedUrl = url.parse(req.url || '', true);
  const pathname = parsedUrl.pathname || '';
  const method = req.method || 'GET';

  if (!pathname.startsWith('/api')) return false;

  const sendJson = (status: number, data: any) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
  };

  try {
    // 1. GET /api/store/:store_code
    let match = pathname.match(/^\/api\/store\/([^/]+)$/);
    if (match && method === 'GET') {
      const store = await getStore(match[1]);
      sendJson(200, store);
      return true;
    }

    // 2. POST /api/stamp/:store_code
    match = pathname.match(/^\/api\/stamp\/([^/]+)$/);
    if (match && method === 'POST') {
      const body = await getRequestBody(req);
      const { phone, count } = body;
      if (!phone) { sendJson(400, { error: 'Phone number is required' }); return true; }
      const result = await addStamp(match[1], phone, parseInt(count || '1'));
      sendJson(200, result);
      return true;
    }

    // 3. GET /api/dashboard/:store_code
    match = pathname.match(/^\/api\/dashboard\/([^/]+)$/);
    if (match && method === 'GET') {
      const storeCode = match[1];
      const [customers, messages] = await Promise.all([
        getCustomers(storeCode),
        getStoreMessages(storeCode),
      ]);

      const churn_summary = {
        safe: customers.filter(c => c.churn_stage === 'safe').length,
        watch: customers.filter(c => c.churn_stage === 'watch').length,
        danger: customers.filter(c => c.churn_stage === 'danger').length,
        churned: customers.filter(c => c.churn_stage === 'churned').length,
      };

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

      const recent_activity = [
        ...customers.slice(0, 3).map(c => ({
          type: 'new_customer',
          customer_name: c.name,
          phone_masked: c.phone_masked,
          occurred_at: c.created_at,
        })),
        ...messages.slice(0, 2).map(m => ({
          type: m.status === 'sent' ? 'message_sent' : 'draft_created',
          customer_name: m.customer_name,
          phone_masked: m.phone_masked,
          occurred_at: m.created_at,
        })),
      ]
        .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
        .slice(0, 6);

      sendJson(200, {
        total_customers: customers.length,
        marketing_consent_count: customers.filter(c => c.marketing_consent).length,
        churn_summary,
        today_stamps: customers.filter(c => c.last_visit_at && new Date(c.last_visit_at).getTime() >= todayStart.getTime()).length || 2,
        recent_visitors_30d: customers.filter(c => c.last_visit_at && new Date(c.last_visit_at).getTime() >= thirtyDaysAgo).length || 4,
        pending_drafts: messages.filter(m => m.status === 'draft').length,
        recent_activity,
      });
      return true;
    }

    // 4. GET /api/customers/:store_code
    match = pathname.match(/^\/api\/customers\/([^/]+)$/);
    if (match && method === 'GET') {
      const filter = (parsedUrl.query.filter as string) || 'all';
      const list = await getCustomers(match[1], filter);
      sendJson(200, list);
      return true;
    }

    // 5. GET /api/customers/:store_code/:id
    match = pathname.match(/^\/api\/customers\/([^/]+)\/([^/]+)$/);
    if (match && method === 'GET') {
      const detail = await getCustomerById(match[1], match[2]);
      if (!detail) { sendJson(404, { error: 'Customer not found' }); return true; }
      sendJson(200, detail);
      return true;
    }

    // 6. POST /api/visit/:store_code
    match = pathname.match(/^\/api\/visit\/([^/]+)$/);
    if (match && method === 'POST') {
      const body = await getRequestBody(req);
      const { customer_id, stamps } = body;
      if (!customer_id) { sendJson(400, { error: 'customer_id is required' }); return true; }
      try {
        const customer = await recordManualVisit(match[1], customer_id, parseInt(stamps || '1'));
        sendJson(200, customer);
      } catch (err: any) {
        sendJson(404, { error: err.message });
      }
      return true;
    }

    // 7. POST /api/generate-message
    match = pathname.match(/^\/api\/generate-message$/);
    if (match && method === 'POST') {
      const body = await getRequestBody(req);
      const { customer_id, store_code } = body;
      if (!customer_id || !store_code) {
        sendJson(400, { error: 'customer_id and store_code are required' });
        return true;
      }
      const [detail, store] = await Promise.all([
        getCustomerById(store_code, customer_id),
        getStore(store_code),
      ]);
      if (!detail) { sendJson(404, { error: 'Customer not found' }); return true; }

      const content = await generateAIMessage(
        detail.customer.name || '고객',
        detail.customer.churn_stage,
        store.reward_desc,
        store.store_name,
        store.message_signature,
      );
      const newMsg = await addMessageDraft(store_code, customer_id, content);
      sendJson(200, newMsg);
      return true;
    }

    // 8. GET /api/messages/:store_code
    match = pathname.match(/^\/api\/messages\/([^/]+)$/);
    if (match && method === 'GET') {
      const list = await getStoreMessages(match[1]);
      sendJson(200, list);
      return true;
    }

    // 9. PATCH /api/messages/:id
    match = pathname.match(/^\/api\/messages\/([^/]+)$/);
    if (match && method === 'PATCH') {
      const body = await getRequestBody(req);
      const { store_code, ...updates } = body;
      if (!store_code) { sendJson(400, { error: 'store_code is required' }); return true; }
      try {
        const updated = await patchMessage(store_code, match[1], updates);
        sendJson(200, updated);
      } catch (err: any) {
        sendJson(404, { error: err.message });
      }
      return true;
    }

    // 10. DELETE /api/messages/:id
    match = pathname.match(/^\/api\/messages\/([^/]+)$/);
    if (match && method === 'DELETE') {
      const storeCode = (parsedUrl.query.store_code as string) || 'demo';
      await deleteMessage(storeCode, match[1]);
      sendJson(200, { success: true });
      return true;
    }

    // 11. POST /api/generate-post
    match = pathname.match(/^\/api\/generate-post$/);
    if (match && method === 'POST') {
      const body = await getRequestBody(req);
      const { store_code, purpose, details, benefit, duration, tone, emphasis } = body;
      if (!store_code) { sendJson(400, { error: 'store_code is required' }); return true; }
      const store = await getStore(store_code);
      const postDraft = await generateAIPost(
        purpose || '소식', details || '', benefit || '',
        duration || '제한 없음', tone || '친근하게', emphasis || '',
        store.store_name,
      );
      sendJson(200, postDraft);
      return true;
    }

    // 12. GET /api/content/:store_code
    match = pathname.match(/^\/api\/content\/([^/]+)$/);
    if (match && method === 'GET') {
      const drafts = await getSavedContentDrafts(match[1]);
      sendJson(200, drafts);
      return true;
    }

    // 13. POST /api/content/:store_code
    match = pathname.match(/^\/api\/content\/([^/]+)$/);
    if (match && method === 'POST') {
      const body = await getRequestBody(req);
      const { channel, content, hashtags } = body;
      if (!channel || !content) { sendJson(400, { error: 'channel and content are required' }); return true; }
      const draft = await saveContentDraft(match[1], channel, content, hashtags || '');
      sendJson(200, draft);
      return true;
    }

    // 14. GET /api/settings/:store_code
    match = pathname.match(/^\/api\/settings\/([^/]+)$/);
    if (match && method === 'GET') {
      const store = await getStore(match[1]);
      sendJson(200, store);
      return true;
    }

    // 15. PATCH /api/settings/:store_code
    match = pathname.match(/^\/api\/settings\/([^/]+)$/);
    if (match && method === 'PATCH') {
      const body = await getRequestBody(req);
      const updated = await updateStore(match[1], body);
      sendJson(200, updated);
      return true;
    }

    // 16. GET /api/metrics/:store_code
    match = pathname.match(/^\/api\/metrics\/([^/]+)$/);
    if (match && method === 'GET') {
      sendJson(200, {
        stamp_completion_rate: 68.5,
        second_visit_rate_30d: 45.2,
        message_revisit_rate: 28.4,
        no_message_revisit_rate: 12.1,
        incremental_revisit_rate: 16.3,
        marketing_consent_rate: 82.0,
      });
      return true;
    }

    sendJson(404, { error: `API route not found: ${pathname}` });
    return true;

  } catch (error: any) {
    console.error('API execution failed', error);
    sendJson(500, { error: 'Internal server error', details: error.message });
    return true;
  }
}
