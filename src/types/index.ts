export type ChurnStage = 'safe' | 'watch' | 'danger' | 'churned';

export interface Store {
  store_code: string;
  store_name: string;
  owner_name: string;
  stamp_goal: number;
  reward_desc: string;
  brand_color: string;
  logo_url: string | null;
  message_signature: string;
}

export interface Customer {
  id: string;
  name: string | null;
  phone: string;
  phone_masked: string;
  churn_stage: ChurnStage;
  last_visit_at: string | null;
  total_visits: number;
  total_stamps: number;
  marketing_consent: boolean;
  marketing_consent_at: string | null;
  created_at: string;
}

export interface CustomerRow extends Customer {}

export interface VisitLog {
  id: string;
  customer_id: string;
  occurred_at: string;
  stamps_earned: number;
}

export interface Message {
  id: string;
  customer_id: string;
  customer_name: string | null;
  phone_masked: string;
  churn_stage: ChurnStage;
  content: string;
  status: 'draft' | 'sent';
  created_at: string;
  sent_at: string | null;
  last_sent_within_30d: boolean;
  marketing_consent: boolean;
}

export interface ChurnResult {
  churn_rate: number;
  stages: {
    safe: number;
    watch: number;
    danger: number;
    churned: number;
  };
}

export interface GeneratedPost {
  instagram_post: string;
  naver_post: string;
  hashtags: string;
}
