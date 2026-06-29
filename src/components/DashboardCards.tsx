import React from 'react';
import { Users, CheckSquare, ShieldCheck, AlertCircle } from 'lucide-react';

interface DashboardCardsProps {
  totalCustomers: number;
  marketingConsentCount: number;
  churnSummary: {
    safe: number;
    watch: number;
    danger: number;
    churned: number;
  };
}

export default function DashboardCards({ totalCustomers, marketingConsentCount, churnSummary }: DashboardCardsProps) {
  const dangerAndWatch = (churnSummary?.watch || 0) + (churnSummary?.danger || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Customers */}
      <div className="premium-card p-6 flex items-start justify-between">
        <div className="space-y-2.5">
          <p className="text-stone-400 text-[10px] font-bold uppercase tracking-wider">전체 등록 고객</p>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-3xl font-extrabold text-stone-900 tracking-tight font-mono">{totalCustomers}</h3>
            <span className="text-stone-500 text-xs font-semibold">명</span>
          </div>
          <p className="text-stone-400/80 text-[11px] font-medium leading-normal">매장에 등록된 누적 단골 수</p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center border border-brand-100/50 shadow-sm shrink-0">
          <Users className="w-5 h-5" />
        </div>
      </div>

      {/* Marketing Consent */}
      <div className="premium-card p-6 flex items-start justify-between">
        <div className="space-y-2.5">
          <p className="text-stone-400 text-[10px] font-bold uppercase tracking-wider">마케팅 동의 고객</p>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-3xl font-extrabold text-emerald-700 tracking-tight font-mono">{marketingConsentCount}</h3>
            <span className="text-stone-500 text-xs font-semibold">명</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100/50 ml-1.5 font-mono">
              {totalCustomers > 0 ? Math.round((marketingConsentCount / totalCustomers) * 100) : 0}%
            </span>
          </div>
          <p className="text-stone-400/80 text-[11px] font-medium leading-normal">메시지 즉시 발송 가능 고객</p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100/50 shadow-sm shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      {/* Danger & Watch */}
      <div className="premium-card p-6 flex items-start justify-between">
        <div className="space-y-2.5">
          <p className="text-stone-400 text-[10px] font-bold uppercase tracking-wider">관심 및 이탈 위험군</p>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-3xl font-extrabold text-amber-700 tracking-tight font-mono">{dangerAndWatch}</h3>
            <span className="text-stone-500 text-xs font-semibold">명</span>
            <span className="text-[10px] font-semibold text-stone-500 ml-1.5">
              (주의 {churnSummary?.watch || 0} / 위험 {churnSummary?.danger || 0})
            </span>
          </div>
          <p className="text-stone-400/80 text-[11px] font-medium leading-normal">재방문 유도 및 타겟 마케팅 대상</p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100/50 shadow-sm shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
