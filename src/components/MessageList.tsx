import React, { useState } from 'react';
import { Message, ChurnStage } from '../types';
import { CHURN_COLOR, CHURN_LABEL } from '../lib/churn';
import { MessageSquare, Send, Trash2, Edit3, Calendar, AlertTriangle, ShieldAlert } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  onSend: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (msg: Message) => void;
}

export default function MessageList({ messages, onSend, onDelete, onEdit }: MessageListProps) {
  const [activeTab, setActiveTab] = useState<'draft' | 'sent'>('draft');

  const filteredMessages = messages.filter((msg) => msg.status === activeTab);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-stone-100 bg-stone-50/50">
        <button
          onClick={() => setActiveTab('draft')}
          className={`flex-1 py-4 text-center text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'draft'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          발송 대기 초안 ({messages.filter((m) => m.status === 'draft').length})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`flex-1 py-4 text-center text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'sent'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          발송 완료 내역 ({messages.filter((m) => m.status === 'sent').length})
        </button>
      </div>

      {/* Message Items List */}
      <div className="divide-y divide-stone-100 p-2">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <MessageSquare className="w-12 h-12 text-stone-300 mb-3" />
            <p className="text-stone-500 font-medium">
              {activeTab === 'draft' ? '발송 대기 중인 초안이 없습니다.' : '발송 완료된 메시지 내역이 없습니다.'}
            </p>
            <p className="text-stone-400 text-xs mt-1">
              {activeTab === 'draft' ? '새 초안 생성 패널에서 AI 초안을 생성해 보세요.' : '대기 중인 초안의 [발송] 버튼을 누르면 발송이 완료됩니다.'}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            return (
              <div key={msg.id} className="p-4 sm:p-5 space-y-4 hover:bg-stone-50/40 rounded-xl transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-stone-800">{msg.customer_name || '미등록'}</span>
                    <span className="text-xs text-stone-400 font-mono">{msg.phone_masked}</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${CHURN_COLOR[msg.churn_stage]}`}>
                      {CHURN_LABEL[msg.churn_stage]}
                    </span>
                    {!msg.marketing_consent && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-500 border border-stone-200">
                        마케팅 미동의
                      </span>
                    )}
                  </div>
                  
                  {/* Date Badge */}
                  <div className="flex items-center gap-1.5 text-xs text-stone-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {msg.status === 'sent' && msg.sent_at
                        ? `${new Date(msg.sent_at).toLocaleDateString('ko-KR')} 발송`
                        : `${new Date(msg.created_at).toLocaleDateString('ko-KR')} 생성`}
                    </span>
                  </div>
                </div>

                {/* 30-Day Warning Banner */}
                {msg.status === 'draft' && msg.last_sent_within_30d && (
                  <div className="flex items-start gap-2 bg-amber-50 rounded-lg p-3 text-xs text-amber-800 border border-amber-100/60">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <div>
                      <strong>중복 발송 경고:</strong> 이 고객은 최근 30일 이내에 메시지를 수신한 이력이 있습니다. 잦은 발송은 피로감을 주어 마케팅 미동의 또는 수신 거부로 이어질 수 있으니 신중히 결정해 주세요.
                    </div>
                  </div>
                )}

                {/* Content Box */}
                <div className="bg-stone-50 rounded-xl p-4 text-sm text-stone-700 font-normal leading-relaxed whitespace-pre-wrap border border-stone-100">
                  {msg.content}
                </div>

                {/* Actions */}
                {msg.status === 'draft' && (
                  <div className="flex justify-end gap-2.5 pt-1">
                    <button
                      onClick={() => onDelete(msg.id)}
                      className="px-3.5 py-2 text-xs font-medium rounded-lg text-stone-500 hover:text-red-700 hover:bg-red-50 hover:border-red-100 transition-all border border-stone-200 flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      삭제
                    </button>
                    <button
                      onClick={() => onEdit(msg)}
                      className="px-3.5 py-2 text-xs font-medium rounded-lg text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-300 transition-all flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      내용 편집
                    </button>
                    
                    <div className="relative group">
                      <button
                        disabled={!msg.marketing_consent}
                        onClick={() => onSend(msg.id)}
                        className={`px-4 py-2 text-xs font-semibold rounded-lg text-white transition-all shadow-sm flex items-center gap-1.5 ${
                          msg.marketing_consent
                            ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 cursor-pointer'
                            : 'bg-stone-300 cursor-not-allowed text-stone-500'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        메시지 발송
                      </button>
                      {!msg.marketing_consent && (
                        <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-stone-900 text-white text-[10px] rounded shadow-lg z-50 text-center leading-normal">
                          마케팅 미동의 고객은 마케팅 메시지를 발송할 수 없습니다.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
