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
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-stone-200">
        <User className="w-12 h-12 text-stone-300 mb-3" />
        <p className="text-stone-500 font-medium">조건에 맞는 고객이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-100 text-stone-500 text-xs font-semibold uppercase tracking-wider">
              <th className="py-4 px-6">고객명</th>
              <th className="py-4 px-6">전화번호</th>
              <th className="py-4 px-6">이탈 상태</th>
              <th className="py-4 px-6">최근 방문일</th>
              <th className="py-4 px-6 text-center">총 방문 / 스탬프</th>
              <th className="py-4 px-6 text-center">마케팅 동의</th>
              <th className="py-4 px-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-sm text-stone-700">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-stone-50/50 transition-colors">
                <td className="py-4 px-6 font-medium text-stone-900">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center font-semibold text-xs">
                      {customer.name ? customer.name[0] : '고'}
                    </div>
                    <span>{customer.name || '미등록 고객'}</span>
                  </div>
                </td>
                <td className="py-4 px-6 font-mono text-stone-500">{customer.phone_masked}</td>
                <td className="py-4 px-6">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${CHURN_COLOR[customer.churn_stage]}`}>
                    {CHURN_LABEL[customer.churn_stage]}
                  </span>
                </td>
                <td className="py-4 px-6 text-stone-500">
                  {customer.last_visit_at ? (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>{new Date(customer.last_visit_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="py-4 px-6 text-center">
                  <span className="font-semibold text-stone-800">{customer.total_visits}</span>회 / <span className="font-semibold text-amber-600">{customer.total_stamps}</span>개
                </td>
                <td className="py-4 px-6">
                  <div className="flex justify-center">
                    {customer.marketing_consent ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                        <Check className="w-3 h-3" /> 동의
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-50 text-stone-400 text-xs font-medium border border-stone-100">
                        <X className="w-3 h-3" /> 미동의
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6 text-right">
                  <button
                    onClick={() => onSelectCustomer?.(customer)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg text-amber-800 bg-amber-50 hover:bg-amber-100/80 transition-all border border-amber-100"
                  >
                    상세 보기
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
