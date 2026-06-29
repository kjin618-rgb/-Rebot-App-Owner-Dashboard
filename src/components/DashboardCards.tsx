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
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-stone-500 text-xs font-semibold uppercase tracking-wider">전체 등록 고객</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-stone-900 tracking-tight">{totalCustomers}</h3>
            <span className="text-stone-500 text-sm">명</span>
          </div>
          <p className="text-stone-400 text-xs">매장에 등록된 누적 고객 수</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
          <Users className="w-6 h-6" />
        </div>
      </div>

      {/* Marketing Consent */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-stone-500 text-xs font-semibold uppercase tracking-wider">마케팅 동의 고객</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-emerald-700 tracking-tight">{marketingConsentCount}</h3>
            <span className="text-stone-500 text-sm">명</span>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 ml-1">
              {totalCustomers > 0 ? Math.round((marketingConsentCount / totalCustomers) * 100) : 0}%
            </span>
          </div>
          <p className="text-stone-400 text-xs">메시지 즉시 발송 가능 고객</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
          <ShieldCheck className="w-6 h-6" />
        </div>
      </div>

      {/* Danger & Watch */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-stone-500 text-xs font-semibold uppercase tracking-wider">관심 및 이탈 위험</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-orange-600 tracking-tight">{dangerAndWatch}</h3>
            <span className="text-stone-500 text-sm">명</span>
            <span className="text-xs text-stone-500 ml-2">
              (관심 {churnSummary?.watch || 0} / 위험 {churnSummary?.danger || 0})
            </span>
          </div>
          <p className="text-stone-400 text-xs">재방문 유도 및 집중 관리 필요</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
          <AlertCircle className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
