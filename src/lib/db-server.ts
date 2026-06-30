import { Store, Customer, VisitLog, Message } from '../types';
import { calcChurn } from './churn';
import { maskPhone } from './phone';
import { getSupabase } from './supabase';

// ─── Mappers ──────────────────────────────────────────────────────────────────

function toStore(row: any): Store {
  return {
    store_code: row.store_code,
    store_name: row.store_name,
    owner_name: row.owner_name,
    stamp_goal: row.stamp_goal ?? 10,
    reward_desc: row.reward_desc ?? '',
    brand_color: '#d97706',
    logo_url: null,
    message_signature: row.message_signature ?? '',
  };
}

function toCustomer(row: any): Customer {
  const lastVisit = row.last_visit_at ?? null;
  return {
    id: row.id,
    name: row.name ?? null,
    phone: row.phone,
    phone_masked: row.phone_masked || maskPhone(row.phone),
    churn_stage: lastVisit ? calcChurn([lastVisit]) : 'churned',
    last_visit_at: lastVisit,
    total_visits: row.total_visits ?? 0,
    total_stamps: row.current_stamps ?? 0,
    marketing_consent: row.marketing_consent ?? false,
    marketing_consent_at: row.marketing_consent_at ?? null,
    created_at: row.created_at,
  };
}

function toVisitLog(row: any): VisitLog {
  return {
    id: row.id,
    customer_id: row.customer_id,
    occurred_at: row.visited_at ?? row.created_at,
    stamps_earned: row.stamps_earned ?? 1,
  };
}

function toMessage(row: any): Message {
  return {
    id: row.id,
    customer_id: row.customer_id,
    customer_name: row.customer_name ?? null,
    phone_masked: row.phone_masked ?? '',
    churn_stage: row.churn_stage ?? 'safe',
    content: row.content,
    status: row.status,
    created_at: row.created_at,
    sent_at: row.sent_at ?? null,
    last_sent_within_30d: row.last_sent_within_30d ?? false,
    marketing_consent: row.marketing_consent ?? true,
  };
}

// store_code → 내부 stores row (UUID id 포함)
async function getStoreRow(storeCode: string) {
  const { data } = await getSupabase()
    .from('stores')
    .select('*')
    .eq('store_code', storeCode)
    .single();
  return data;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export async function getStore(storeCode: string): Promise<Store> {
  const row = await getStoreRow(storeCode);
  if (row) return toStore(row);

  // 없으면 자동 생성
  const { data } = await getSupabase()
    .from('stores')
    .insert({
      store_code: storeCode,
      store_name: `${storeCode} 매장`,
      owner_name: '사장님',
      stamp_goal: 10,
      reward_desc: '스탬프 10개 적립 시 음료 1잔 무료',
      message_signature: `${storeCode} 사장 드림`,
    })
    .select()
    .single();

  return toStore(data);
}

export async function updateStore(storeCode: string, settings: Partial<Store>): Promise<Store> {
  const updates: Record<string, any> = {};
  if (settings.store_name !== undefined) updates.store_name = settings.store_name;
  if (settings.owner_name !== undefined) updates.owner_name = settings.owner_name;
  if (settings.stamp_goal !== undefined) updates.stamp_goal = settings.stamp_goal;
  if (settings.reward_desc !== undefined) updates.reward_desc = settings.reward_desc;
  if (settings.message_signature !== undefined) updates.message_signature = settings.message_signature;

  const { data } = await getSupabase()
    .from('stores')
    .update(updates)
    .eq('store_code', storeCode)
    .select()
    .single();

  return toStore(data);
}

// ─── Customer ─────────────────────────────────────────────────────────────────

export async function getCustomers(storeCode: string, filter: string = 'all'): Promise<Customer[]> {
  // TODO Phase 2: .eq('store_id', storeRow.id) 로 매장별 필터 적용
  const { data } = await getSupabase()
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  const customers = (data || []).map(toCustomer);
  if (filter === 'all') return customers;
  return customers.filter(c => c.churn_stage === filter);
}

export async function getCustomerById(storeCode: string, id: string): Promise<{
  customer: Customer;
  stats: any;
  visit_logs: VisitLog[];
  messages: Message[];
} | null> {
  // TODO Phase 2: storeRow.id 로 매장 소속 검증 추가
  const { data: cRow } = await getSupabase()
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (!cRow) return null;
  const customer = toCustomer(cRow);

  const [{ data: vlRows }, { data: msgRows }] = await Promise.all([
    getSupabase()
      .from('visit_logs')
      .select('*')
      .eq('customer_id', id)
      .order('visited_at', { ascending: false }),
    getSupabase()
      .from('messages')
      .select('*')
      .eq('customer_id', id)
      .order('created_at', { ascending: false }),
  ]);

  return {
    customer,
    stats: {
      total_visits: customer.total_visits,
      total_stamps: customer.total_stamps,
      last_visit_at: customer.last_visit_at,
    },
    visit_logs: (vlRows || []).map(toVisitLog),
    messages: (msgRows || []).map(toMessage),
  };
}

export async function addStamp(storeCode: string, phone: string, count: number = 1): Promise<{ customer: Customer; earned: number }> {
  const storeRow = await getStoreRow(storeCode);
  if (!storeRow) throw new Error('Store not found');

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const nowStr = new Date().toISOString();

  const { data: existing } = await getSupabase()
    .from('customers')
    .select('*')
    .eq('store_id', storeRow.id)
    .eq('phone', cleanPhone)
    .single();

  let customerRow: any;

  if (!existing) {
    const { data } = await getSupabase()
      .from('customers')
      .insert({
        store_id: storeRow.id,
        phone: cleanPhone,
        phone_masked: maskPhone(cleanPhone),
        marketing_consent: true,
        marketing_consent_at: nowStr,
        current_stamps: count,
        total_stamps: count,
        total_visits: 1,
        last_visit_at: nowStr,
      })
      .select()
      .single();
    customerRow = data;
  } else {
    const { data } = await getSupabase()
      .from('customers')
      .update({
        current_stamps: existing.current_stamps + count,
        total_stamps: existing.total_stamps + count,
        total_visits: existing.total_visits + 1,
        last_visit_at: nowStr,
      })
      .eq('id', existing.id)
      .select()
      .single();
    customerRow = data;
  }

  await getSupabase().from('visit_logs').insert({
    customer_id: customerRow.id,
    store_id: storeRow.id,
    visited_at: nowStr,
    stamps_earned: count,
    source: 'kiosk',
  });

  return { customer: toCustomer(customerRow), earned: count };
}

export async function recordManualVisit(storeCode: string, customerId: string, stamps: number = 1): Promise<Customer> {
  const storeRow = await getStoreRow(storeCode);
  if (!storeRow) throw new Error('Store not found');

  const { data: existing } = await getSupabase()
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .eq('store_id', storeRow.id)
    .single();

  if (!existing) throw new Error('Customer not found');

  const nowStr = new Date().toISOString();

  const { data } = await getSupabase()
    .from('customers')
    .update({
      current_stamps: existing.current_stamps + stamps,
      total_stamps: existing.total_stamps + stamps,
      total_visits: existing.total_visits + 1,
      last_visit_at: nowStr,
    })
    .eq('id', customerId)
    .select()
    .single();

  await getSupabase().from('visit_logs').insert({
    customer_id: customerId,
    store_id: storeRow.id,
    visited_at: nowStr,
    stamps_earned: stamps,
    source: 'manual',
  });

  return toCustomer(data);
}

// ─── Message ──────────────────────────────────────────────────────────────────

export async function getStoreMessages(storeCode: string): Promise<Message[]> {
  // TODO Phase 2: .eq('store_id', storeRow.id) 로 매장별 필터 적용
  const { data } = await getSupabase()
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });

  return (data || []).map(toMessage);
}

export async function addMessageDraft(storeCode: string, customerId: string, content: string): Promise<Message> {
  const storeRow = await getStoreRow(storeCode);
  if (!storeRow) throw new Error('Store not found');

  const { data: cRow } = await getSupabase()
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();
  if (!cRow) throw new Error('Customer not found');

  const customer = toCustomer(cRow);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentSent } = await getSupabase()
    .from('messages')
    .select('id')
    .eq('customer_id', customerId)
    .eq('store_id', storeRow.id)
    .eq('status', 'sent')
    .gte('sent_at', thirtyDaysAgo)
    .limit(1);

  const { data } = await getSupabase()
    .from('messages')
    .insert({
      store_id: storeRow.id,
      customer_id: customerId,
      customer_name: customer.name,
      phone_masked: customer.phone_masked,
      churn_stage: customer.churn_stage,
      content,
      status: 'draft',
      last_sent_within_30d: (recentSent?.length ?? 0) > 0,
      marketing_consent: customer.marketing_consent,
    })
    .select()
    .single();

  return toMessage(data);
}

export async function patchMessage(storeCode: string, id: string, updates: Partial<Message>): Promise<Message> {
  const storeRow = await getStoreRow(storeCode);
  if (!storeRow) throw new Error('Store not found');

  const dbUpdates: Record<string, any> = {};
  if (updates.content !== undefined) dbUpdates.content = updates.content;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.sent_at !== undefined) dbUpdates.sent_at = updates.sent_at;

  const { data } = await getSupabase()
    .from('messages')
    .update(dbUpdates)
    .eq('id', id)
    .eq('store_id', storeRow.id)
    .select()
    .single();

  if (!data) throw new Error('Message not found');
  return toMessage(data);
}

export async function deleteMessage(storeCode: string, id: string): Promise<void> {
  const storeRow = await getStoreRow(storeCode);
  if (!storeRow) return;

  await getSupabase()
    .from('messages')
    .delete()
    .eq('id', id)
    .eq('store_id', storeRow.id);
}

// ─── Content Drafts ───────────────────────────────────────────────────────────

export async function getSavedContentDrafts(storeCode: string): Promise<any[]> {
  // TODO Phase 2: .eq('store_id', storeRow.id) 로 매장별 필터 적용
  const { data } = await getSupabase()
    .from('content_drafts')
    .select('*')
    .order('created_at', { ascending: false });

  return data || [];
}

export async function saveContentDraft(storeCode: string, channel: string, content: string, hashtags: string): Promise<any> {
  const storeRow = await getStoreRow(storeCode);
  if (!storeRow) throw new Error('Store not found');

  const { data } = await getSupabase()
    .from('content_drafts')
    .insert({ store_id: storeRow.id, channel, content, hashtags, status: 'saved' })
    .select()
    .single();

  return data;
}
