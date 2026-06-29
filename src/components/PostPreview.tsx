import React from 'react';
import { Target, ArrowRight, Sparkles } from 'lucide-react';

interface PostPreviewProps {
  watchCount: number;
  dangerCount: number;
  churnedCount: number;
  onCampaignTrigger?: (stage: 'watch' | 'danger' | 'churned') => void;
}

export default function PostPreview({ watchCount, dangerCount, churnedCount, onCampaignTrigger }: PostPreviewProps) {
  const totalTargetable = watchCount + dangerCount + churnedCount;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-600" />
          <h4 className="font-semibold text-stone-900 text-base">맞춤 타겟 고객군</h4>
        </div>
        <span className="text-stone-400 text-xs font-medium">총 {totalTargetable}명 타겟 가능</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Watch Stage */}
        <div className="bg-yellow-50/50 rounded-xl p-4 border border-yellow-100 space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded">관심 필요</span>
            <div className="text-2xl font-bold text-stone-900 mt-2">{watchCount}명</div>
            <p className="text-stone-500 text-xs mt-1">방문 주기가 조금 길어지기 시작한 고객들</p>
          </div>
          <button
            onClick={() => onCampaignTrigger?.('watch')}
            className="mt-3 text-xs font-medium text-yellow-900 hover:text-yellow-950 flex items-center gap-1 group transition-colors self-start"
          >
            <span>캠페인 제안</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Danger Stage */}
        <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-100 space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-orange-800 bg-orange-100 px-2 py-0.5 rounded">이탈 위험</span>
            <div className="text-2xl font-bold text-stone-900 mt-2">{dangerCount}명</div>
            <p className="text-stone-500 text-xs mt-1">이탈 위기! 강력한 혜택으로 재유치 필요</p>
          </div>
          <button
            onClick={() => onCampaignTrigger?.('danger')}
            className="mt-3 text-xs font-medium text-orange-900 hover:text-orange-950 flex items-center gap-1 group transition-colors self-start"
          >
            <span>쿠폰 보내기</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Churned Stage */}
        <div className="bg-red-50/50 rounded-xl p-4 border border-red-100 space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-red-800 bg-red-100 px-2 py-0.5 rounded">장기 미방문</span>
            <div className="text-2xl font-bold text-stone-900 mt-2">{churnedCount}명</div>
            <p className="text-stone-500 text-xs mt-1">마지막 방문 이후 상당한 시간이 흐른 고객들</p>
          </div>
          <button
            onClick={() => onCampaignTrigger?.('churned')}
            className="mt-3 text-xs font-medium text-red-900 hover:text-red-950 flex items-center gap-1 group transition-colors self-start"
          >
            <span>재소환 메시지</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      <div className="bg-amber-50/40 rounded-xl p-3.5 border border-amber-100/60 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong>AI 추천 캠페인:</strong> 현재 이탈 위험 단계의 고객이 늘어나고 있습니다. 마케팅 수신동의를 마친 <strong>{dangerCount}명</strong>의 위험군 고객에게 스페셜 소금빵 증정 문자를 지금 발송해 보세요. 리방문율을 최대 <strong>28.4%</strong>까지 올릴 수 있습니다.
        </div>
      </div>
    </div>
  );
}
