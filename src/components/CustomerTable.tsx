import React from 'react';
import { CustomerRow } from '../types';
import { CHURN_LABEL, CHURN_COLOR } from '../lib/churn';
import { User, Calendar, Check, X } from 'lucide-react';

interface CustomerTableProps {
  storeCode: string;
  customers: CustomerRow[];
  onSelectCustomer?: (customer: CustomerRow) => void;
}

export default function CustomerTable({ storeCode, customers, onSelectCustomer }: CustomerTableProps) {
  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-stone-200/60 shadow-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center mb-4 text-stone-300">
          <User className="w-6 h-6" />
        </div>
        <p className="text-stone-700 font-bold text-sm">조건에 맞는 고객이 없습니다.</p>
        <p className="text-stone-400 text-xs mt-1">새로운 검색어나 탭을 선택해 보세요.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200/60 overflow-hidden shadow-[0_4px_20px_rgba(139,115,85,0.03)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50/75 border-b border-stone-100 text-stone-400 text-[10px] font-bold uppercase tracking-wider">
              <th className="py-4.5 px-6">고객명</th>
              <th className="py-4.5 px-6">전화번호</th>
              <th className="py-4.5 px-6">이탈 위험군</th>
              <th className="py-4.5 px-6">최근 방문일</th>
              <th className="py-4.5 px-6 text-center">총 방문 / 스탬프</th>
              <th className="py-4.5 px-6 text-center">마케팅 동의</th>
              <th className="py-4.5 px-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-xs text-stone-600">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-brand-50/10 transition-colors duration-200 group">
                <td className="py-4 px-6 font-semibold text-stone-900">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-800 flex items-center justify-center font-bold text-xs border border-brand-100/50">
                      {customer.name ? customer.name[0] : '고'}
                    </div>
                    <span className="group-hover:text-brand-800 transition-colors">{customer.name || '미등록 고객'}</span>
                  </div>
                </td>
                <td className="py-4 px-6 font-mono text-stone-500 tracking-wide">{customer.phone_masked}</td>
                <td className="py-4 px-6">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${CHURN_COLOR[customer.churn_stage]}`}>
                    {CHURN_LABEL[customer.churn_stage]}
                  </span>
                </td>
                <td className="py-4 px-6 text-stone-500">
                  {customer.last_visit_at ? (
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>{new Date(customer.last_visit_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                  ) : (
                    <span className="text-stone-300">-</span>
                  )}
                </td>
                <td className="py-4 px-6 text-center font-medium">
                  <span className="font-bold text-stone-900 font-mono text-sm">{customer.total_visits}</span>회 / <span className="font-bold text-brand-600 font-mono text-sm">{customer.total_stamps}</span>개
                </td>
                <td className="py-4 px-6">
                  <div className="flex justify-center">
                    {customer.marketing_consent ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100/50">
                        <Check className="w-3 h-3 stroke-[2.5]" /> 수신동의
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-50 text-stone-400 text-[10px] font-bold border border-stone-100">
                        <X className="w-3 h-3 stroke-[2.5]" /> 미동의
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6 text-right">
                  <button
                    onClick={() => onSelectCustomer?.(customer)}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg text-brand-800 bg-brand-50 hover:bg-brand-100 hover:text-brand-900 transition-all border border-brand-100/50 cursor-pointer shadow-xs"
                  >
                    상세 정보
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
