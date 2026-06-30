// src/lib/churn.ts
function calcChurn(dates) {
  if (!dates || dates.length === 0) return "churned";
  const sorted = [...dates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const lastVisit = new Date(sorted[0]);
  const now = /* @__PURE__ */ new Date();
  const diffTime = Math.abs(now.getTime() - lastVisit.getTime());
  const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
  if (diffDays <= 14) return "safe";
  if (diffDays <= 30) return "watch";
  if (diffDays <= 60) return "danger";
  return "churned";
}

// src/lib/phone.ts
function normalizePhone(phone) {
  return phone.replace(/[^0-9]/g, "");
}
function maskPhone(phone) {
  const clean = normalizePhone(phone);
  if (clean.length === 11) {
    return `${clean.slice(0, 3)}-****-${clean.slice(7)}`;
  } else if (clean.length === 10) {
    return `${clean.slice(0, 3)}-***-${clean.slice(6)}`;
  }
  return phone;
}

// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
var _client = null;
function getSupabase() {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env");
    }
    _client = createClient(url, key, { auth: { persistSession: false } });
  }
  return _client;
}

// src/lib/db-server.ts
function toStore(row) {
  return {
    store_code: row.store_code,
    store_name: row.store_name,
    owner_name: row.owner_name,
    stamp_goal: row.stamp_goal ?? 10,
    reward_desc: row.reward_desc ?? "",
    brand_color: "#d97706",
    logo_url: null,
    message_signature: row.message_signature ?? ""
  };
}
function toCustomer(row) {
  const lastVisit = row.last_visit_at ?? null;
  return {
    id: row.id,
    name: row.name ?? null,
    phone: row.phone,
    phone_masked: row.phone_masked || maskPhone(row.phone),
    churn_stage: lastVisit ? calcChurn([lastVisit]) : "churned",
    last_visit_at: lastVisit,
    total_visits: row.total_visits ?? 0,
    total_stamps: row.current_stamps ?? 0,
    marketing_consent: row.marketing_consent ?? false,
    marketing_consent_at: row.marketing_consent_at ?? null,
    created_at: row.created_at
  };
}
function toVisitLog(row) {
  return {
    id: row.id,
    customer_id: row.customer_id,
    occurred_at: row.visited_at ?? row.created_at,
    stamps_earned: row.stamps_earned ?? 1
  };
}
function toMessage(row) {
  return {
    id: row.id,
    customer_id: row.customer_id,
    customer_name: row.customer_name ?? null,
    phone_masked: row.phone_masked ?? "",
    churn_stage: row.churn_stage ?? "safe",
    content: row.content,
    status: row.status,
    created_at: row.created_at,
    sent_at: row.sent_at ?? null,
    last_sent_within_30d: row.last_sent_within_30d ?? false,
    marketing_consent: row.marketing_consent ?? true
  };
}
async function getStoreRow(storeCode) {
  const { data } = await getSupabase().from("stores").select("*").eq("store_code", storeCode).single();
  return data;
}
async function getStore(storeCode) {
  const row = await getStoreRow(storeCode);
  if (row) return toStore(row);
  const { data } = await getSupabase().from("stores").insert({
    store_code: storeCode,
    store_name: `${storeCode} \uB9E4\uC7A5`,
    owner_name: "\uC0AC\uC7A5\uB2D8",
    stamp_goal: 10,
    reward_desc: "\uC2A4\uD0EC\uD504 10\uAC1C \uC801\uB9BD \uC2DC \uC74C\uB8CC 1\uC794 \uBB34\uB8CC",
    message_signature: `${storeCode} \uC0AC\uC7A5 \uB4DC\uB9BC`
  }).select().single();
  return toStore(data);
}
async function updateStore(storeCode, settings) {
  const updates = {};
  if (settings.store_name !== void 0) updates.store_name = settings.store_name;
  if (settings.owner_name !== void 0) updates.owner_name = settings.owner_name;
  if (settings.stamp_goal !== void 0) updates.stamp_goal = settings.stamp_goal;
  if (settings.reward_desc !== void 0) updates.reward_desc = settings.reward_desc;
  if (settings.message_signature !== void 0) updates.message_signature = settings.message_signature;
  const { data } = await getSupabase().from("stores").update(updates).eq("store_code", storeCode).select().single();
  return toStore(data);
}
async function getCustomers(storeCode, filter = "all") {
  const storeRow = await getStoreRow(storeCode);
  if (!storeRow) return [];
  const { data } = await getSupabase().from("customers").select("*").eq("store_id", storeRow.id).order("created_at", { ascending: false });
  const customers = (data || []).map(toCustomer);
  if (filter === "all") return customers;
  return customers.filter((c) => c.churn_stage === filter);
}
async function getCustomerById(storeCode, id) {
  const storeRow = await getStoreRow(storeCode);
  if (!storeRow) return null;
  const { data: cRow } = await getSupabase().from("customers").select("*").eq("id", id).eq("store_id", storeRow.id).single();
  if (!cRow) return null;
  const customer = toCustomer(cRow);
  const [{ data: vlRows }, { data: msgRows }] = await Promise.all([
    getSupabase().from("visit_logs").select("*").eq("customer_id", id).eq("store_id", storeRow.id).order("visited_at", { ascending: false }),
    getSupabase().from("messages").select("*").eq("customer_id", id).eq("store_id", storeRow.id).order("created_at", { ascending: false })
  ]);
  return {
    customer,
    stats: {
      total_visits: customer.total_visits,
      total_stamps: customer.total_stamps,
      last_visit_at: customer.last_visit_at
    },
    visit_logs: (vlRows || []).map(toVisitLog),
    messages: (msgRows || []).map(toMessage)
  };
}
async function addStamp(storeCode, phone, count = 1) {
  const storeRow = await getStoreRow(storeCode);
  if (!storeRow) throw new Error("Store not found");
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const nowStr = (/* @__PURE__ */ new Date()).toISOString();
  const { data: existing } = await getSupabase().from("customers").select("*").eq("store_id", storeRow.id).eq("phone", cleanPhone).single();
  let customerRow;
  if (!existing) {
    const { data } = await getSupabase().from("customers").insert({
      store_id: storeRow.id,
      phone: cleanPhone,
      phone_masked: maskPhone(cleanPhone),
      marketing_consent: true,
      marketing_consent_at: nowStr,
      current_stamps: count,
      total_stamps: count,
      total_visits: 1,
      last_visit_at: nowStr
    }).select().single();
    customerRow = data;
  } else {
    const { data } = await getSupabase().from("customers").update({
      current_stamps: existing.current_stamps + count,
      total_stamps: existing.total_stamps + count,
      total_visits: existing.total_visits + 1,
      last_visit_at: nowStr
    }).eq("id", existing.id).select().single();
    customerRow = data;
  }
  await getSupabase().from("visit_logs").insert({
    customer_id: customerRow.id,
    store_id: storeRow.id,
    visited_at: nowStr,
    stamps_earned: count,
    source: "kiosk"
  });
  return { customer: toCustomer(customerRow), earned: count };
}
async function recordManualVisit(storeCode, customerId, stamps = 1) {
  const storeRow = await getStoreRow(storeCode);
  if (!storeRow) throw new Error("Store not found");
  const { data: existing } = await getSupabase().from("customers").select("*").eq("id", customerId).eq("store_id", storeRow.id).single();
  if (!existing) throw new Error("Customer not found");
  const nowStr = (/* @__PURE__ */ new Date()).toISOString();
  const { data } = await getSupabase().from("customers").update({
    current_stamps: existing.current_stamps + stamps,
    total_stamps: existing.total_stamps + stamps,
    total_visits: existing.total_visits + 1,
    last_visit_at: nowStr
  }).eq("id", customerId).select().single();
  await getSupabase().from("visit_logs").insert({
    customer_id: customerId,
    store_id: storeRow.id,
    visited_at: nowStr,
    stamps_earned: stamps,
    source: "manual"
  });
  return toCustomer(data);
}
async function getStoreMessages(storeCode) {
  const storeRow = await getStoreRow(storeCode);
  if (!storeRow) return [];
  const { data } = await getSupabase().from("messages").select("*").eq("store_id", storeRow.id).order("created_at", { ascending: false });
  return (data || []).map(toMessage);
}
async function addMessageDraft(storeCode, customerId, content) {
  const storeRow = await getStoreRow(storeCode);
  if (!storeRow) throw new Error("Store not found");
  const { data: cRow } = await getSupabase().from("customers").select("*").eq("id", customerId).eq("store_id", storeRow.id).single();
  if (!cRow) throw new Error("Customer not found");
  const customer = toCustomer(cRow);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString();
  const { data: recentSent } = await getSupabase().from("messages").select("id").eq("customer_id", customerId).eq("store_id", storeRow.id).eq("status", "sent").gte("sent_at", thirtyDaysAgo).limit(1);
  const { data } = await getSupabase().from("messages").insert({
    store_id: storeRow.id,
    customer_id: customerId,
    customer_name: customer.name,
    phone_masked: customer.phone_masked,
    churn_stage: customer.churn_stage,
    content,
    status: "draft",
    last_sent_within_30d: (recentSent?.length ?? 0) > 0,
    marketing_consent: customer.marketing_consent
  }).select().single();
  return toMessage(data);
}
async function patchMessage(storeCode, id, updates) {
  const storeRow = await getStoreRow(storeCode);
  if (!storeRow) throw new Error("Store not found");
  const dbUpdates = {};
  if (updates.content !== void 0) dbUpdates.content = updates.content;
  if (updates.status !== void 0) dbUpdates.status = updates.status;
  if (updates.sent_at !== void 0) dbUpdates.sent_at = updates.sent_at;
  const { data } = await getSupabase().from("messages").update(dbUpdates).eq("id", id).eq("store_id", storeRow.id).select().single();
  if (!data) throw new Error("Message not found");
  return toMessage(data);
}
async function deleteMessage(storeCode, id) {
  const storeRow = await getStoreRow(storeCode);
  if (!storeRow) return;
  await getSupabase().from("messages").delete().eq("id", id).eq("store_id", storeRow.id);
}
async function getSavedContentDrafts(storeCode) {
  const storeRow = await getStoreRow(storeCode);
  if (!storeRow) return [];
  const { data } = await getSupabase().from("content_drafts").select("*").eq("store_id", storeRow.id).order("created_at", { ascending: false });
  return data || [];
}
async function saveContentDraft(storeCode, channel, content, hashtags) {
  const storeRow = await getStoreRow(storeCode);
  if (!storeRow) throw new Error("Store not found");
  const { data } = await getSupabase().from("content_drafts").insert({ store_id: storeRow.id, channel, content, hashtags, status: "saved" }).select().single();
  return data;
}

// src/lib/prompts.ts
function buildMessagePrompt(customerName, churnStage, rewardDesc, storeName, signature) {
  return `\uB2F9\uC2E0\uC740 \uCE74\uD398/\uBCA0\uC774\uCEE4\uB9AC \uB9E4\uC7A5\uC778 "${storeName}"\uC758 \uCE5C\uC808\uD55C \uC0AC\uC7A5\uB2D8\uC785\uB2C8\uB2E4.
\uACE0\uAC1D "${customerName}"\uB2D8\uC740 \uD604\uC7AC \uC774\uD0C8 \uB2E8\uACC4\uAC00 "${churnStage}" \uC0C1\uD0DC\uC785\uB2C8\uB2E4.
\uB9E4\uC7A5\uC758 \uB9AC\uC6CC\uB4DC \uD61C\uD0DD: "${rewardDesc}"
\uC11C\uBA85: "${signature}"

\uC704 \uC815\uBCF4\uB97C \uBC14\uD0D5\uC73C\uB85C \uACE0\uAC1D\uC758 \uC7AC\uBC29\uBB38\uC744 \uC720\uB3C4\uD558\uAE30 \uC704\uD55C \uAC1C\uC778\uD654\uB41C \uB9C8\uCF00\uD305 \uBA54\uC2DC\uC9C0 \uCD08\uC548\uC744 \uC791\uC131\uD574\uC8FC\uC138\uC694.
\uC790\uC5F0\uC2A4\uB7FD\uACE0 \uCE5C\uADFC\uD55C \uD55C\uAD6D\uC5B4\uB85C \uC791\uC131\uD558\uBA70, \uB108\uBB34 \uC2A4\uD338\uCC98\uB7FC \uB290\uAEF4\uC9C0\uC9C0 \uC54A\uACE0 \uC9C4\uC2EC\uC5B4\uB9B0 \uD61C\uD0DD \uC548\uB0B4\uB97C \uD3EC\uD568\uD574\uC57C \uD569\uB2C8\uB2E4.
\uBA54\uC2DC\uC9C0 \uBCF8\uBB38 \uB0B4\uC6A9\uB9CC \uD14D\uC2A4\uD2B8\uB85C \uBC18\uD658\uD574\uC8FC\uC138\uC694.`;
}
function buildPostPrompt(purpose, details, benefit, duration, tone, emphasis, storeName) {
  return `\uB2F9\uC2E0\uC740 \uCE74\uD398/\uBCA0\uC774\uCEE4\uB9AC \uB9E4\uC7A5\uC778 "${storeName}"\uC758 \uC720\uB2A5\uD55C \uB9C8\uCF00\uD130\uC774\uC790 \uC0AC\uC7A5\uB2D8\uC785\uB2C8\uB2E4.
\uC544\uB798\uC758 \uC785\uB825\uAC12\uC744 \uBC14\uD0D5\uC73C\uB85C SNS \uD64D\uBCF4 \uCF58\uD150\uCE20 \uCD08\uC548\uC744 \uC791\uC131\uD574\uC8FC\uC138\uC694.

\uD64D\uBCF4 \uBAA9\uC801: ${purpose}
\uC0C1\uC138 \uB0B4\uC6A9: ${details}
\uD61C\uD0DD: ${benefit}
\uAE30\uAC04: ${duration}
\uC6D0\uD558\uB294 \uB9D0\uD22C: ${tone} (\uC608: \uCE5C\uADFC\uD558\uAC8C, \uACF5\uC2DD\uC801\uC73C\uB85C, \uAC10\uC131\uC801\uC73C\uB85C)
\uAC15\uC870\uD560 \uB0B4\uC6A9: ${emphasis}

\uCD9C\uB825 \uD3EC\uB9F7\uC740 \uBC18\uB4DC\uC2DC \uC544\uB798\uC758 JSON \uD615\uC2DD\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4. \uCF54\uB4DC\uBE14\uB85D \uC5C6\uC774 \uC21C\uC218 JSON\uB9CC \uCD9C\uB825\uD558\uC138\uC694:
{
  "instagram_post": "\uC778\uC2A4\uD0C0\uADF8\uB7A8\uC6A9 \uD3EC\uC2A4\uD305 \uBCF8\uBB38 (\uC904\uBC14\uAFC8 \uD3EC\uD568, \uC774\uBAA8\uC9C0 \uC801\uADF9 \uD65C\uC6A9, \uAC00\uB3C5\uC131 \uB192\uC740 \uB808\uC774\uC544\uC6C3)",
  "naver_post": "\uB124\uC774\uBC84 \uD50C\uB808\uC774\uC2A4 \uC18C\uC2DD\uC6A9 \uD3EC\uC2A4\uD305 \uBCF8\uBB38 (\uC124\uBA85\uC870, \uC0C1\uC138 \uC815\uBCF4 \uD3EC\uD568)",
  "hashtags": "\uCD94\uCC9C \uD574\uC2DC\uD0DC\uADF8 \uBAA9\uB85D (\uACF5\uBC31\uC73C\uB85C \uAD6C\uBD84\uB41C \uD574\uC2DC\uD0DC\uADF8\uB4E4)"
}`;
}

// src/lib/openrouter.ts
function parseJson(text) {
  try {
    const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON", text, e);
    return {};
  }
}

// src/lib/ai-server.ts
var aiClient = null;
async function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      try {
        const { GoogleGenAI } = await import("@google/genai");
        aiClient = new GoogleGenAI({ apiKey: key });
      } catch (e) {
        console.error("Failed to initialize GoogleGenAI client", e);
      }
    }
  }
  return aiClient;
}
function getFallbackMessage(customerName, churnStage, rewardDesc, storeName, signature) {
  if (churnStage === "danger") {
    return `[${storeName}] ${customerName} \uACE0\uAC1D\uB2D8, \uC548\uB155\uD558\uC138\uC694.
\uD55C\uB3D9\uC548 \uB9E4\uC7A5\uC5D0 \uBC1C\uAC78\uC74C\uC774 \uB738\uD558\uC154\uC11C \uB9CE\uC774 \uC11C\uC6B4\uD558\uACE0 \uC548\uBD80\uAC00 \uAD81\uAE08\uD55C \uB9C8\uC74C\uC5D0 \uBA54\uC2DC\uC9C0 \uB4DC\uB9BD\uB2C8\uB2E4. \u{1F622}

\uC800\uD76C\uB97C \uC78A\uC9C0 \uC54A\uACE0 \uCC3E\uC544\uC8FC\uC2DC\uB294 \uB9C8\uC74C\uC5D0 \uBCF4\uB2F5\uD558\uACE0\uC790 \uD2B9\uBCC4\uD55C \uC120\uBB3C\uC744 \uC900\uBE44\uD588\uC5B4\uC694. 
\uC774\uBC88 \uC8FC \uC911 \uB9E4\uC7A5\uC5D0 \uBC29\uBB38\uD574\uC8FC\uC2DC\uBA74 \uB530\uB73B\uD55C \uC704\uB85C\uAC00 \uB420 \uC218 \uC788\uB294 [\uC2DC\uADF8\uB2C8\uCC98 \uC544\uBA54\uB9AC\uCE74\uB178 \uB610\uB294 \uC18C\uAE08\uBE75 1\uAC1C \uBB34\uB8CC \uC81C\uACF5] \uD61C\uD0DD\uC744 \uB4DC\uB9BD\uB2C8\uB2E4!

* \uB9E4\uC7A5 \uD61C\uD0DD \uB9AC\uC6CC\uB4DC: ${rewardDesc}

\uBC14\uC05C \uC77C\uC0C1 \uC911 \uC7A0\uC2DC \uC5EC\uC720\uB97C \uB204\uB9AC\uC2E4 \uC218 \uC788\uB3C4\uB85D \uC815\uC131\uAECF \uAD6C\uC6B4 \uBE75\uACFC \uC2E0\uC120\uD55C \uCEE4\uD53C\uB85C \uAE30\uB2E4\uB9AC\uACE0 \uC788\uACA0\uC2B5\uB2C8\uB2E4.

${signature}`;
  } else if (churnStage === "watch") {
    return `[${storeName}] ${customerName} \uACE0\uAC1D\uB2D8, \uB298 \uAC10\uC0AC\uB4DC\uB9BD\uB2C8\uB2E4.
\uCD5C\uADFC \uB0A0\uC528\uAC00 \uCC38 \uC88B\uC740\uB370, \uAC74\uAC15\uD788 \uC798 \uC9C0\uB0B4\uACE0 \uACC4\uC2DC\uB098\uC694? 

\uC694\uC998 \uB9E4\uC7A5\uC5D0 \uB9DB\uC788\uB294 \uC2E0\uBA54\uB274\uB4E4\uC774 \uAC00\uB4DD \uCC44\uC6CC\uC838 \uC788\uB294\uB370, \uC624\uB79C\uB9CC\uC5D0 \uACE0\uAC1D\uB2D8 \uC0DD\uAC01\uC774 \uB098\uC11C \uC18C\uC2DD \uC804\uD569\uB2C8\uB2E4. 
\uC774\uBC88 \uC8FC \uB0B4\uC5D0 \uB9E4\uC7A5\uC5D0 \uB4E4\uB7EC\uC8FC\uC2DC\uBA74 \uC2A4\uD0EC\uD504\uB97C 2\uBC30\uB85C \uC801\uB9BD\uD574 \uB4DC\uB9AC\uB294 \uD2B9\uBCC4 \uC774\uBCA4\uD2B8\uB97C \uC81C\uACF5\uD574 \uB4DC\uB9AC\uB824\uACE0 \uD574\uC694! \u2B50\uFE0F

* \uB9E4\uC7A5 \uD61C\uD0DD \uB9AC\uC6CC\uB4DC: ${rewardDesc}

\uB530\uB73B\uD55C \uC628\uAE30\uAC00 \uB0A8\uC544\uC788\uC744 \uB54C \uB4DC\uC2DC\uBA74 \uAC00\uC7A5 \uB9DB\uC788\uB294 \uC800\uD76C \uBE75\uB4E4 \uAC00\uB4DD \uC900\uBE44\uD574\uB458 \uD14C\uB2C8, \uD3B8\uD558\uAC8C \uCC3E\uC544\uC8FC\uC138\uC694. 

${signature}`;
  } else {
    return `[${storeName}] ${customerName} \uACE0\uAC1D\uB2D8, \uC624\uB79C\uB9CC\uC5D0 \uC778\uC0AC \uC62C\uB9BD\uB2C8\uB2E4.
\uADF8\uB3D9\uC548 \uB9AC\uBD07 \uBCA0\uC774\uCEE4\uB9AC\uB97C \uAE30\uC5B5\uD558\uACE0 \uC0AC\uB791\uD574 \uC8FC\uC154\uC11C \uC9C4\uC2EC\uC73C\uB85C \uAC10\uC0AC\uB4DC\uB9BD\uB2C8\uB2E4.

\uB9C8\uC9C0\uB9C9\uC73C\uB85C \uBC29\uBB38\uD574 \uC8FC\uC2E0 \uC9C0 \uC2DC\uAC04\uC774 \uC81C\uBC95 \uD758\uB7EC, \uD639\uC2DC \uB9E4\uC7A5\uC5D0 \uBD88\uD3B8\uD55C \uC810\uC774 \uC788\uC73C\uC168\uB358 \uAC74 \uC544\uB2D0\uAE4C \uAC71\uC815 \uBC18, \uADF8\uB9AC\uC6C0 \uBC18\uC73C\uB85C \uC18C\uC2DD\uC744 \uC804\uD569\uB2C8\uB2E4.
\uACE0\uAC1D\uB2D8\uC744 \uC704\uD574 \uD2B9\uBCC4\uD788 \uB9C8\uB828\uD55C \uC74C\uB8CC \uBB34\uB8CC \uC2DC\uC74C \uCFE0\uD3F0\uACFC \uD568\uAED8, \uB530\uB048\uD558\uAC8C \uAD6C\uC6B4 \uB300\uD45C \uBE75 \uC138\uD2B8\uB97C \uC900\uBE44\uD588\uC2B5\uB2C8\uB2E4.

* \uB9E4\uC7A5 \uD61C\uD0DD \uB9AC\uC6CC\uB4DC: ${rewardDesc}

\uC870\uC6A9\uD558\uACE0 \uC544\uB291\uD55C \uB9E4\uC7A5\uC5D0\uC11C \uAE4A\uC740 \uD48D\uBBF8\uC758 \uCEE4\uD53C\uC640 \uD568\uAED8 \uC77C\uC0C1\uC758 \uD53C\uB85C\uB97C \uD480\uACE0 \uAC00\uC138\uC694. \uC5B8\uC81C\uB4E0 \uD658\uC601\uD569\uB2C8\uB2E4!

${signature}`;
  }
}
function getFallbackPost(purpose, details, benefit, duration, tone, emphasis, storeName) {
  return {
    instagram_post: `\u{1F35E} ${storeName}\uC5D0\uC11C \uC804\uD558\uB294 \uD2B9\uBCC4\uD55C \uC18C\uC2DD! \u{1F950}\u2728

\uC5EC\uB7EC\uBD84\uC744 \uC704\uD55C \uC5C4\uCCAD\uB09C \uD589\uBCF5 \uC815\uBCF4\uAC00 \uCC3E\uC544\uC654\uC2B5\uB2C8\uB2E4! \u{1F9E1}

\u{1F449} \uC774\uBC88 \uD64D\uBCF4 \uD14C\uB9C8: [${purpose}]

${details || "\uB9E4\uC7A5\uC5D0\uC11C \uC815\uC131\uC2A4\uB808 \uC900\uBE44\uD55C \uC2A4\uD398\uC15C \uBE75\uACFC \uD5A5\uAE0B\uD55C \uC5D0\uC2A4\uD504\uB808\uC18C!"}

\u{1F381} \uC774\uBC88 \uCEA0\uD398\uC778\uC758 \uCD08\uD2B9\uAE09 \uD61C\uD0DD:
\u{1F525} ${benefit || "\uC120\uD0DD \uD488\uBAA9 10% \uCD94\uAC00 \uD560\uC778 \uB610\uB294 \uC801\uB9BD\uAE08 2\uBC30!"}

\u23F0 \uAE30\uAC04: ${duration}
\u{1F4E2} \uAC15\uC870: ${emphasis || "\uB2F9\uC77C \uBC18\uC8FD \uBC0F \uB2F9\uC77C \uC18C\uC9C4 \uC6D0\uCE59 \uACE0\uC218!"}

\uB530\uB73B\uD55C \uBD84\uC704\uAE30 \uAC00\uB4DD\uD55C \uC800\uD76C \uB9E4\uC7A5\uC5D0 \uC624\uC154\uC11C \uAE30\uBD84 \uC88B\uC740 \uC5EC\uC720\uB97C \uB290\uAEF4\uBCF4\uC138\uC694. \uC5B8\uC81C\uB098 \uD589\uBCF5\uD55C \uD558\uB8E8 \uB418\uC138\uC694! \u2615\uFE0F`,
    naver_post: `[${storeName} \uC18C\uC2DD] \uC548\uB155\uD558\uC138\uC694, ${storeName} \uC0AC\uC7A5\uC785\uB2C8\uB2E4.

\uC800\uD76C \uB9E4\uC7A5\uC744 \uC544\uAEF4\uC8FC\uC2DC\uB294 \uB2E8\uACE8 \uACE0\uAC1D\uBD84\uB4E4\uC744 \uC704\uD55C \uD2B9\uBCC4\uD55C \uD61C\uD0DD \uBC0F \uC18C\uC2DD\uC744 \uC548\uB0B4\uD574 \uB4DC\uB9BD\uB2C8\uB2E4.

\uC774\uBC88 \uC18C\uC2DD \uC8FC\uC81C: ${purpose}

\uC0C1\uC138 \uC124\uBA85:
${details || "\uB9E4\uC77C \uC544\uCE68 \uC5C4\uC120\uB41C \uD504\uB791\uC2A4\uC0B0 \uCD5C\uACE0\uAE09 \uACE0\uBA54 \uBC84\uD130\uC640 \uCC9C\uC77C\uC5FC\uC73C\uB85C \uAD6C\uC6CC\uB0B4\uB294 \uC815\uC131 \uAC00\uB4DD \uC18C\uAE08\uBE75\uC758 \uAE4A\uACE0 \uBD80\uB4DC\uB7EC\uC6B4 \uB9DB\uC744 \uC990\uACA8\uBCF4\uC138\uC694."}

- \uD2B9\uBCC4 \uC81C\uACF5 \uD61C\uD0DD: ${benefit || "\uD3EC\uC7A5 \uC8FC\uBB38 \uC2DC 10% \uCD94\uAC00 \uD61C\uD0DD \uC801\uC6A9"}
- \uC9C4\uD589 \uAE30\uAC04: ${duration}
- \uB9E4\uC7A5 \uAC15\uC870\uC810: ${emphasis || "\uCCA0\uC800\uD55C \uC704\uC0DD \uAD00\uB9AC \uBC0F \uC2E0\uC120\uD55C \uB2F9\uC77C \uB9E5\uC8FC \uC6D0\uCE59!"}

\uB124\uC774\uBC84 \uC608\uC57D\uC744 \uD1B5\uD574 \uC0AC\uC804 \uB2E8\uCCB4 \uC8FC\uBB38\uB3C4 \uAC00\uB2A5\uD558\uB2C8 \uD3B8\uD558\uAC8C \uD65C\uC6A9\uD574 \uBCF4\uC2DC\uAE30 \uBC14\uB78D\uB2C8\uB2E4. \uAC10\uC0AC\uD569\uB2C8\uB2E4.`,
    kakao_post: `[${storeName} \uCE74\uCE74\uC624 \uCC44\uB110 \uC548\uB0B4]

\uD56D\uC0C1 \uC800\uD76C \uB9E4\uC7A5\uC744 \uBC29\uBB38\uD574 \uC8FC\uC154\uC11C \uC9C4\uC2EC\uC73C\uB85C \uAC10\uC0AC\uB4DC\uB9BD\uB2C8\uB2E4.
\uCE74\uCE74\uC624 \uCC44\uB110 \uB2E8\uB3C5 \uD2B9\uBCC4 \uD560\uC778/\uC801\uB9BD \uCEA0\uD398\uC778 \uC18C\uC2DD\uC744 \uC804\uB2EC\uD574 \uB4DC\uB9BD\uB2C8\uB2E4!

\u{1F4AC} \uBAA9\uC801: ${purpose}

${details || "\uC815\uC131\uC744 \uB4EC\uBFCD \uB123\uC740 \uBE75\uB4E4\uACFC \uD5A5\uAE0B\uD55C \uC74C\uB8CC\uB4E4\uB85C \uAC00\uB4DD\uD55C \uD558\uB8E8\uB97C \uC120\uBB3C\uD569\uB2C8\uB2E4."}

\u{1F381} \uCE74\uCE74\uC624\uCC44\uB110 \uCE5C\uAD6C \uB300\uC0C1 \uD61C\uD0DD:
\u{1F449} ${benefit || "\uB9E4\uC7A5 \uCE74\uC6B4\uD130\uC5D0 \uCC44\uB110 \uD654\uBA74 \uC81C\uC2DC \uC2DC \uBE75 \uBA54\uB274 10% \uC989\uC2DC \uD560\uC778"}

\u{1F4C6} \uD589\uC0AC \uAE30\uAC04: ${duration}
\u26A1\uFE0F \uC911\uC694 \uC548\uB0B4: ${emphasis || "\uD55C\uC815 \uC218\uB7C9 \uC870\uC9C4 \uC2DC \uD589\uC0AC\uAC00 \uC870\uAE30 \uB9C8\uAC10\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4."}

\uC544\uB798\uC758 \uBC84\uD2BC\uC744 \uB204\uB974\uAC70\uB098 \uB9E4\uC7A5 \uCE74\uC6B4\uD130\uC5D0 \uC778\uC99D\uD558\uC154\uC11C \uD61C\uD0DD\uC744 \uB193\uCE58\uC9C0 \uB9C8\uC138\uC694!`,
    hashtags: `#${storeName.replace(/\s+/g, "")} #${purpose.replace(/\s+/g, "")} #\uBCA0\uC774\uCEE4\uB9AC\uCE74\uD398 #\uC18C\uAE08\uBE75\uB9DB\uC9D1 #\uB514\uC800\uD2B8\uB9DB\uC9D1 #\uAC10\uC131\uCE74\uD398 #\uB3D9\uB124\uC18C\uAE08\uBE75 #\uBE75\uC9C0\uC21C\uB840`
  };
}
async function generateAIMessage(customerName, churnStage, rewardDesc, storeName, signature) {
  const prompt = buildMessagePrompt(customerName, churnStage, rewardDesc, storeName, signature);
  if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== "MY_OPENROUTER_API_KEY") {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-lite",
          messages: [{ role: "user", content: prompt }]
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text.trim();
      }
    } catch (e) {
      console.error("OpenRouter generation failed, trying Gemini", e);
    }
  }
  const gemini = await getGeminiClient();
  if (gemini) {
    try {
      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      if (response && response.text) {
        return response.text.trim();
      }
    } catch (e) {
      console.error("Gemini generation failed, falling back to templates", e);
    }
  }
  return getFallbackMessage(customerName, churnStage, rewardDesc, storeName, signature);
}
async function generateAIPost(purpose, details, benefit, duration, tone, emphasis, storeName) {
  const prompt = buildPostPrompt(purpose, details, benefit, duration, tone, emphasis, storeName);
  const processJson = (rawText) => {
    try {
      const parsed = parseJson(rawText);
      if (parsed && parsed.instagram_post && parsed.naver_post) {
        if (!parsed.kakao_post) {
          parsed.kakao_post = `[${storeName} \uC18C\uC2DD]

${parsed.instagram_post}

\u{1F381} \uD2B9\uBCC4 \uD61C\uD0DD: ${benefit || "\uB2E8\uB3C5 \uC81C\uACF5"}
\u23F0 \uAE30\uAC04: ${duration}`;
        }
        return parsed;
      }
    } catch (e) {
      console.error("Failed to parse AI JSON response, applying raw extraction", e);
    }
    return null;
  };
  if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== "MY_OPENROUTER_API_KEY") {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-lite",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          const result = processJson(text);
          if (result) return result;
        }
      }
    } catch (e) {
      console.error("OpenRouter post generation failed, trying Gemini", e);
    }
  }
  const gemini = await getGeminiClient();
  if (gemini) {
    try {
      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      if (response && response.text) {
        const result = processJson(response.text);
        if (result) return result;
      }
    } catch (e) {
      console.error("Gemini post generation failed, falling back to templates", e);
    }
  }
  return getFallbackPost(purpose, details, benefit, duration, tone, emphasis, storeName);
}

// src/lib/api-handlers.ts
function getRequestBody(req) {
  return new Promise((resolve) => {
    if (req.body !== void 0) {
      resolve(req.body);
      return;
    }
    let bodyStr = "";
    req.on("data", (chunk) => {
      bodyStr += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(bodyStr ? JSON.parse(bodyStr) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}
async function handleApiRequest(req, res) {
  const reqUrl = new URL(req.url || "/", "http://localhost");
  const pathname = reqUrl.pathname;
  const query = reqUrl.searchParams;
  const method = req.method || "GET";
  if (!pathname.startsWith("/api")) return false;
  const sendJson = (status, data) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(data));
  };
  try {
    let match = pathname.match(/^\/api\/store\/([^/]+)$/);
    if (match && method === "GET") {
      const store = await getStore(match[1]);
      sendJson(200, store);
      return true;
    }
    match = pathname.match(/^\/api\/stamp\/([^/]+)$/);
    if (match && method === "POST") {
      const body = await getRequestBody(req);
      const { phone, count } = body;
      if (!phone) {
        sendJson(400, { error: "Phone number is required" });
        return true;
      }
      const result = await addStamp(match[1], phone, parseInt(count || "1"));
      sendJson(200, result);
      return true;
    }
    match = pathname.match(/^\/api\/dashboard\/([^/]+)$/);
    if (match && method === "GET") {
      const storeCode = match[1];
      const [customers, messages] = await Promise.all([
        getCustomers(storeCode),
        getStoreMessages(storeCode)
      ]);
      const churn_summary = {
        safe: customers.filter((c) => c.churn_stage === "safe").length,
        watch: customers.filter((c) => c.churn_stage === "watch").length,
        danger: customers.filter((c) => c.churn_stage === "danger").length,
        churned: customers.filter((c) => c.churn_stage === "churned").length
      };
      const todayStart = /* @__PURE__ */ new Date();
      todayStart.setHours(0, 0, 0, 0);
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1e3;
      const recent_activity = [
        ...customers.slice(0, 3).map((c) => ({
          type: "new_customer",
          customer_name: c.name,
          phone_masked: c.phone_masked,
          occurred_at: c.created_at
        })),
        ...messages.slice(0, 2).map((m) => ({
          type: m.status === "sent" ? "message_sent" : "draft_created",
          customer_name: m.customer_name,
          phone_masked: m.phone_masked,
          occurred_at: m.created_at
        }))
      ].sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()).slice(0, 6);
      sendJson(200, {
        total_customers: customers.length,
        marketing_consent_count: customers.filter((c) => c.marketing_consent).length,
        churn_summary,
        today_stamps: customers.filter((c) => c.last_visit_at && new Date(c.last_visit_at).getTime() >= todayStart.getTime()).length,
        recent_visitors_30d: customers.filter((c) => c.last_visit_at && new Date(c.last_visit_at).getTime() >= thirtyDaysAgo).length,
        pending_drafts: messages.filter((m) => m.status === "draft").length,
        recent_activity
      });
      return true;
    }
    match = pathname.match(/^\/api\/customers\/([^/]+)$/);
    if (match && method === "GET") {
      const filter = query.get("filter") || "all";
      const list = await getCustomers(match[1], filter);
      sendJson(200, list);
      return true;
    }
    match = pathname.match(/^\/api\/customers\/([^/]+)\/([^/]+)$/);
    if (match && method === "GET") {
      const detail = await getCustomerById(match[1], match[2]);
      if (!detail) {
        sendJson(404, { error: "Customer not found" });
        return true;
      }
      sendJson(200, detail);
      return true;
    }
    match = pathname.match(/^\/api\/visit\/([^/]+)$/);
    if (match && method === "POST") {
      const body = await getRequestBody(req);
      const { customer_id, stamps } = body;
      if (!customer_id) {
        sendJson(400, { error: "customer_id is required" });
        return true;
      }
      try {
        const customer = await recordManualVisit(match[1], customer_id, parseInt(stamps || "1"));
        sendJson(200, customer);
      } catch (err) {
        sendJson(404, { error: err.message });
      }
      return true;
    }
    match = pathname.match(/^\/api\/generate-message$/);
    if (match && method === "POST") {
      const body = await getRequestBody(req);
      const { customer_id, store_code } = body;
      if (!customer_id || !store_code) {
        sendJson(400, { error: "customer_id and store_code are required" });
        return true;
      }
      const [detail, store] = await Promise.all([
        getCustomerById(store_code, customer_id),
        getStore(store_code)
      ]);
      if (!detail) {
        sendJson(404, { error: "Customer not found" });
        return true;
      }
      const content = await generateAIMessage(
        detail.customer.name || "\uACE0\uAC1D",
        detail.customer.churn_stage,
        store.reward_desc,
        store.store_name,
        store.message_signature
      );
      const newMsg = await addMessageDraft(store_code, customer_id, content);
      sendJson(200, newMsg);
      return true;
    }
    match = pathname.match(/^\/api\/messages\/([^/]+)$/);
    if (match && method === "GET") {
      const list = await getStoreMessages(match[1]);
      sendJson(200, list);
      return true;
    }
    match = pathname.match(/^\/api\/messages\/([^/]+)$/);
    if (match && method === "PATCH") {
      const body = await getRequestBody(req);
      const { store_code, ...updates } = body;
      if (!store_code) {
        sendJson(400, { error: "store_code is required" });
        return true;
      }
      try {
        const updated = await patchMessage(store_code, match[1], updates);
        sendJson(200, updated);
      } catch (err) {
        sendJson(404, { error: err.message });
      }
      return true;
    }
    match = pathname.match(/^\/api\/messages\/([^/]+)$/);
    if (match && method === "DELETE") {
      const storeCode = query.get("store_code") || "demo";
      await deleteMessage(storeCode, match[1]);
      sendJson(200, { success: true });
      return true;
    }
    match = pathname.match(/^\/api\/generate-post$/);
    if (match && method === "POST") {
      const body = await getRequestBody(req);
      const { store_code, purpose, details, benefit, duration, tone, emphasis } = body;
      if (!store_code) {
        sendJson(400, { error: "store_code is required" });
        return true;
      }
      const store = await getStore(store_code);
      const postDraft = await generateAIPost(
        purpose || "\uC18C\uC2DD",
        details || "",
        benefit || "",
        duration || "\uC81C\uD55C \uC5C6\uC74C",
        tone || "\uCE5C\uADFC\uD558\uAC8C",
        emphasis || "",
        store.store_name
      );
      sendJson(200, postDraft);
      return true;
    }
    match = pathname.match(/^\/api\/content\/([^/]+)$/);
    if (match && method === "GET") {
      const drafts = await getSavedContentDrafts(match[1]);
      sendJson(200, drafts);
      return true;
    }
    match = pathname.match(/^\/api\/content\/([^/]+)$/);
    if (match && method === "POST") {
      const body = await getRequestBody(req);
      const { channel, content, hashtags } = body;
      if (!channel || !content) {
        sendJson(400, { error: "channel and content are required" });
        return true;
      }
      const draft = await saveContentDraft(match[1], channel, content, hashtags || "");
      sendJson(200, draft);
      return true;
    }
    match = pathname.match(/^\/api\/settings\/([^/]+)$/);
    if (match && method === "GET") {
      const store = await getStore(match[1]);
      sendJson(200, store);
      return true;
    }
    match = pathname.match(/^\/api\/settings\/([^/]+)$/);
    if (match && method === "PATCH") {
      const body = await getRequestBody(req);
      const updated = await updateStore(match[1], body);
      sendJson(200, updated);
      return true;
    }
    match = pathname.match(/^\/api\/metrics\/([^/]+)$/);
    if (match && method === "GET") {
      sendJson(200, {
        stamp_completion_rate: 68.5,
        second_visit_rate_30d: 45.2,
        message_revisit_rate: 28.4,
        no_message_revisit_rate: 12.1,
        incremental_revisit_rate: 16.3,
        marketing_consent_rate: 82
      });
      return true;
    }
    sendJson(404, { error: `API route not found: ${pathname}` });
    return true;
  } catch (error) {
    console.error("API execution failed", error);
    sendJson(500, { error: "Internal server error", details: error.message });
    return true;
  }
}

// src/serverless/handler.ts
async function handler(req, res) {
  const handled = await handleApiRequest(req, res);
  if (!handled && !res.writableEnded) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "API route not found" }));
  }
}
export {
  handler as default
};
