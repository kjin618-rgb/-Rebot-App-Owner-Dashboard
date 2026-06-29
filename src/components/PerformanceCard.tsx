import React from 'react';
import { PerformanceMetrics } from '../lib/mock';
import { TrendingUp, Award, RefreshCw, MessageSquare, ShieldCheck, Zap } from 'lucide-react';

interface PerformanceCardProps {
  metrics: PerformanceMetrics | null;
}

export default function PerformanceCard({ metrics }: PerformanceCardProps) {
  const renderMetricValue = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-500 border border-stone-200">
          <RefreshCw className="w-3 h-3 animate-spin-slow" />
          측정 중
        </span>
      );
    }
    return (
      <span className="text-2xl font-bold text-stone-900 tracking-tight">
        {value.toFixed(1)}<span className="text-sm font-medium text-stone-500 ml-0.5">%</span>
      </span>
    );
  };

  const items = [
    {
      title: '스탬프 완성률',
      desc: '목표 스탬프 개수를 채워 혜택을 받은 고객 비율',
      value: metrics?.stamp_completion_rate,
      icon: Award,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      title: '30일 이내 재방문율',
      desc: '첫 방문 후 30일 이내에 다시 찾아주신 고객 비율',
      value: metrics?.second_visit_rate_30d,
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'AI 메시지 수신군 재방문율',
      desc: '재방문 제안 메시지를 받고 매장에 재방문한 비율',
      value: metrics?.message_revisit_rate,
      icon: MessageSquare,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      title: '메시지 미발송군 재방문율',
      desc: '메시지를 받지 않고 자발적으로 재방문한 고객 비율',
      value: metrics?.no_message_revisit_rate,
      icon: Zap,
      color: 'text-stone-500 bg-stone-100 border-stone-200',
    },
    {
      title: '마케팅 동의율',
      desc: '스탬프 적립 시 마케팅 수신동의를 해준 고객 비율',
      value: metrics?.marketing_consent_rate,
      icon: ShieldCheck,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
  ];

  return (
    <div className="premium-card p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
        <h4 className="font-bold text-stone-900 text-sm tracking-tight">캠페인 및 매장 핵심 성과 지표</h4>
        {metrics?.incremental_revisit_rate !== null && metrics?.incremental_revisit_rate !== undefined && (
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100/50 px-2.5 py-1 rounded-lg">
            메시지 효과 순증가율: +{metrics.incremental_revisit_rate.toFixed(1)}%p
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="p-4 bg-stone-50/40 hover:bg-brand-50/20 rounded-xl border border-stone-100 flex flex-col justify-between space-y-4 transition-all duration-300">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center border shadow-xs shrink-0 ${item.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <h5 className="font-bold text-stone-800 text-xs truncate" title={item.title}>
                    {item.title}
                  </h5>
                </div>
                <p className="text-[10px] text-stone-400 font-medium leading-normal line-clamp-2">
                  {item.desc}
                </p>
              </div>

              <div className="pt-1 border-t border-stone-100/40">
                {renderMetricValue(item.value)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
