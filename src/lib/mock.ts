import { ChurnStage } from '../types';

// Helper to get items from localStorage or fallback
function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored) as T;
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
}

// Helper to set item in localStorage
function setLocalStorageItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export interface ActivityItem {
  type: 'stamp' | 'new_customer' | 'draft_created' | 'message_sent';
  customer_name: string | null;
  phone_masked: string;
  occurred_at: string;
}

export interface DashboardExtended {
  today_stamps: number;
  recent_visitors_30d: number;
  pending_drafts: number;
  recent_activity: ActivityItem[];
}

export interface ContentDraft {
  id: string;
  channel: 'instagram' | 'naver' | 'kakao';
  content: string;
  hashtags: string;
  status: 'draft' | 'saved';
  created_at: string;
}

export interface StoreSettings {
  store_name: string;
  owner_name: string;
  stamp_goal: number;
  reward_desc: string;
  brand_color: string;
  logo_url: string | null;
  message_signature: string;
}

export interface PerformanceMetrics {
  stamp_completion_rate: number | null;
  second_visit_rate_30d: number | null;
  message_revisit_rate: number | null;
  no_message_revisit_rate: number | null;
  incremental_revisit_rate: number | null;
  marketing_consent_rate: number | null;
}

// 1. getDashboardExtended
// TODO: replace with /api/dashboard/[store_code]
export async function getDashboardExtended(store_code: string): Promise<DashboardExtended> {
  const key = `rebot_activity_${store_code}`;
  const defaultActivity: ActivityItem[] = [
    { type: 'stamp', customer_name: '김민수', phone_masked: '010-****-5678', occurred_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
    { type: 'new_customer', customer_name: '이지은', phone_masked: '010-****-1234', occurred_at: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
    { type: 'draft_created', customer_name: '박지성', phone_masked: '010-****-8765', occurred_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
    { type: 'message_sent', customer_name: '최민지', phone_masked: '010-****-4321', occurred_at: new Date(Date.now() - 1000 * 60 * 240).toISOString() },
  ];
  const activity = getLocalStorageItem<ActivityItem[]>(key, defaultActivity);

  return {
    today_stamps: 8,
    recent_visitors_30d: 42,
    pending_drafts: 3,
    recent_activity: activity,
  };
}

// 2. getMessages
// TODO: replace with /api/messages/[store_code]
export async function getMessages(store_code: string) {
  const key = `rebot_messages_${store_code}`;
  const defaultMessages = [
    {
      id: 'msg_1',
      customer_id: 'cust_1',
      customer_name: '김도우',
      phone_masked: '010-****-1234',
      churn_stage: 'danger' as ChurnStage,
      content: '[리봇 베이커리] 김도우 고객님, 한동안 매장에서 뵙지 못해 아쉬운 마음입니다. 오랜만에 방문해주시면 갓 구운 소금빵 1개 서비스 쿠폰을 드릴게요! 시그니처 아메리카노와 함께 즐겨보세요. 매장에서 기다리겠습니다. 감사합니다.',
      status: 'draft' as const,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      sent_at: null,
      last_sent_within_30d: false,
    },
    {
      id: 'msg_2',
      customer_id: 'cust_2',
      customer_name: '이서윤',
      phone_masked: '010-****-5678',
      churn_stage: 'watch' as ChurnStage,
      content: '[리봇 베이커리] 이서윤 고객님, 늘 저희 매장을 찾아주셔서 감사합니다. 최근 발걸음이 뜸하셔서 안부가 궁금하네요. 금주 방문하시면 스탬프 2배 적립 혜택을 드려요! 편하신 시간에 들러주세요.',
      status: 'draft' as const,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      sent_at: null,
      last_sent_within_30d: true, // 30일 이내 발송 이력 있음 경고 발생용
    },
    {
      id: 'msg_3',
      customer_id: 'cust_3',
      customer_name: '박정우',
      phone_masked: '010-****-9876',
      churn_stage: 'churned' as ChurnStage,
      content: '[리봇 베이커리] 박정우 고객님, 오랜만에 인사드립니다. 늘 아껴주시는 마음에 감사하며 특별 리워드 쿠폰(음료 1잔 무료)을 준비했습니다. 따뜻한 빵 냄새 가득한 리봇에서 힐링하고 가세요.',
      status: 'sent' as const,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      sent_at: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString(),
      last_sent_within_30d: false,
    },
  ];
  return getLocalStorageItem(key, defaultMessages);
}

// 3. getContentDrafts
// TODO: replace with /api/content/[store_code]
export async function getContentDrafts(store_code: string): Promise<ContentDraft[]> {
  const key = `rebot_content_drafts_${store_code}`;
  const defaultDrafts: ContentDraft[] = [
    {
      id: 'draft_1',
      channel: 'instagram',
      content: '🍞 리봇 베이커리 소금빵 입고 완료! 🥐\n\n많은 분들이 기다려주신 리봇의 시그니처 프랑스 고메버터 소금빵이 갓 구워져 나왔습니다. 겉은 바삭하고 속은 쫄깃하면서, 씹을수록 퍼지는 짭조름하고 고소한 풍미! 한 입 드셔보시면 멈출 수 없을 거예요.\n\n매일 한정 수량으로 구워지니, 늦기 전에 리봇 베이커리로 서둘러 방문해 보세요! ✨',
      hashtags: '#소금빵맛집 #베이커리카페 #성수동맛집 #빵지순례 #버터풍미 #갓구운빵',
      status: 'saved',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    },
    {
      id: 'draft_2',
      channel: 'naver',
      content: '[알림] 프랑스 전통 고메버터를 듬뿍 사용한 리봇 베이커리의 소금빵이 새롭게 출시되었습니다.\n\n매일 아침 매장에서 신선하게 반죽하고 굽는 과정을 거쳐 제공됩니다. 짭조름한 천일염과 부드러운 버터의 환상적인 콜라보레이션을 즐겨보세요.\n\n포장 주문 시 10% 할인 혜택도 제공되오니 네이버 주문을 통해 편하게 만나보세요.',
      hashtags: '#소금빵출시 #단체주문환영 #네이버주문 #베이커리카페',
      status: 'saved',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    },
  ];
  return getLocalStorageItem<ContentDraft[]>(key, defaultDrafts);
}

// 4. saveContentDraft
// TODO: replace with POST /api/content/[store_code]
export async function saveContentDraft(store_code: string, draft: Omit<ContentDraft, 'id' | 'created_at'>): Promise<ContentDraft> {
  const key = `rebot_content_drafts_${store_code}`;
  const drafts = await getContentDrafts(store_code);
  const newDraft: ContentDraft = {
    ...draft,
    id: `draft_${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  drafts.unshift(newDraft);
  setLocalStorageItem(key, drafts);
  return newDraft;
}

// 5. getStoreSettings
// TODO: replace with /api/settings/[store_code]
export async function getStoreSettings(store_code: string): Promise<StoreSettings> {
  const key = `rebot_settings_${store_code}`;
  const defaultSettings: StoreSettings = {
    store_name: '리봇 베이커리',
    owner_name: '김리봇',
    stamp_goal: 10,
    reward_desc: '스탬프 10개 적립 시 아메리카노 또는 클래식 소금빵 1개 무료 제공',
    brand_color: '#d97706',
    logo_url: null,
    message_signature: '리봇 베이커리 사장 드림',
  };
  return getLocalStorageItem<StoreSettings>(key, defaultSettings);
}

// 6. updateStoreSettings
// TODO: replace with PATCH /api/settings/[store_code]
export async function updateStoreSettings(store_code: string, settings: Partial<StoreSettings>): Promise<StoreSettings> {
  const key = `rebot_settings_${store_code}`;
  const current = await getStoreSettings(store_code);
  const updated = { ...current, ...settings };
  setLocalStorageItem(key, updated);
  return updated;
}

// 7. getPerformanceMetrics
// TODO: replace with /api/metrics/[store_code]
export async function getPerformanceMetrics(store_code: string): Promise<PerformanceMetrics> {
  return {
    stamp_completion_rate: 68.5,
    second_visit_rate_30d: 45.2,
    message_revisit_rate: 28.4,
    no_message_revisit_rate: 12.1,
    incremental_revisit_rate: 16.3, // 메시지 발송군 리방문율 - 미발송군 리방문율
    marketing_consent_rate: 82.0,
  };
}

// 8. generateQRCode
// TODO: replace with real QR library
export async function generateQRCode(store_code: string): Promise<string> {
  // Return an SVG data URL for a nice-looking mock QR code
  const url = `${window.location.origin}/stamp/${store_code}`;
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
    <rect width="180" height="180" fill="%23f5f5f4" rx="12"/>
    <!-- Position indicators -->
    <rect x="15" y="15" width="40" height="40" fill="%23d97706" rx="4"/>
    <rect x="23" y="23" width="24" height="24" fill="white" rx="2"/>
    <rect x="28" y="28" width="14" height="14" fill="%23d97706" rx="1"/>
    
    <rect x="125" y="15" width="40" height="40" fill="%23d97706" rx="4"/>
    <rect x="133" y="133" width="24" height="24" fill="white" rx="2"/>
    <rect x="138" y="138" width="14" height="14" fill="%23d97706" rx="1"/>
    
    <rect x="15" y="125" width="40" height="40" fill="%23d97706" rx="4"/>
    <rect x="23" y="133" width="24" height="24" fill="white" rx="2"/>
    <rect x="28" y="138" width="14" height="14" fill="%23d97706" rx="1"/>
    
    <rect x="125" y="125" width="40" height="40" fill="%23d97706" rx="4"/>

    <!-- Small random qr dots -->
    <rect x="65" y="20" width="10" height="10" fill="%2378716c"/>
    <rect x="85" y="15" width="15" height="10" fill="%2378716c"/>
    <rect x="70" y="35" width="20" height="10" fill="%23d97706"/>
    <rect x="105" y="25" width="10" height="20" fill="%2378716c"/>
    
    <rect x="20" y="65" width="20" height="10" fill="%2378716c"/>
    <rect x="15" y="85" width="10" height="15" fill="%23d97706"/>
    <rect x="35" y="80" width="15" height="15" fill="%2378716c"/>
    
    <rect x="65" y="65" width="50" height="50" fill="%23d97706" rx="6"/>
    <rect x="73" y="73" width="34" height="34" fill="white" rx="4"/>
    <!-- Small R in middle -->
    <text x="90" y="96" font-family="system-ui, sans-serif" font-weight="bold" font-size="22" fill="%23d97706" text-anchor="middle">R</text>

    <rect x="125" y="65" width="15" height="15" fill="%2378716c"/>
    <rect x="145" y="75" width="20" height="10" fill="%2378716c"/>
    <rect x="130" y="95" width="10" height="20" fill="%23d97706"/>
    
    <rect x="65" y="125" width="15" height="15" fill="%2378716c"/>
    <rect x="85" y="135" width="25" height="10" fill="%2378716c"/>
    <rect x="70" y="150" width="15" height="15" fill="%23d97706"/>
    
    <rect x="125" y="125" width="20" height="10" fill="%2378716c"/>
    <text x="90" y="172" font-family="system-ui, sans-serif" font-size="7" fill="%2378716c" text-anchor="middle" letter-spacing="1">REBOT CRM</text>
  </svg>`;
}
