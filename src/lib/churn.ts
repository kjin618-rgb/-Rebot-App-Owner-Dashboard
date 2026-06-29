import { ChurnStage } from '../types';

export const CHURN_LABEL: Record<ChurnStage, string> = {
  safe: '정상',
  watch: '관심 필요',
  danger: '이탈 위험',
  churned: '장기 미방문',
};

export const CHURN_COLOR: Record<ChurnStage, string> = {
  safe: 'bg-green-100 text-green-800 border-green-200',
  watch: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  danger: 'bg-orange-100 text-orange-800 border-orange-200',
  churned: 'bg-red-100 text-red-800 border-red-200',
};

export function calcChurn(dates: string[]): ChurnStage {
  if (!dates || dates.length === 0) return 'churned';
  
  // Get latest date
  const sorted = [...dates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const lastVisit = new Date(sorted[0]);
  const now = new Date(); // Using 2026-06-28T23:12:07-07:00 as the reference time in general, or runtime
  const diffTime = Math.abs(now.getTime() - lastVisit.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 14) return 'safe';
  if (diffDays <= 30) return 'watch';
  if (diffDays <= 60) return 'danger';
  return 'churned';
}
