import React, { useState, useEffect } from 'react';
import { generateQRCode } from '../lib/mock';
import { Download, Link as LinkIcon, Check, Copy, QrCode } from 'lucide-react';

interface QRPreviewProps {
  storeCode: string;
}

export default function QRPreview({ storeCode }: QRPreviewProps) {
  const [qrSrc, setQrSrc] = useState<string>('');
  const [copied, setCopied] = useState(false);
  // Fixed to localhost for local dev/demo scanning (e.g. via adb reverse or same-machine access).
  const stampUrl = `http://localhost:3000/stamp/${storeCode}`;

  useEffect(() => {
    async function loadQR() {
      const src = await generateQRCode(stampUrl);
      setQrSrc(src);
    }
    loadQR();
  }, [stampUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(stampUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrSrc) return;
    const link = document.createElement('a');
    link.href = qrSrc;
    link.download = `rebot_stamp_qr_${storeCode}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
      <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
        <QrCode className="w-5 h-5 text-amber-600" />
        <h3 className="font-semibold text-stone-900 text-base">매장 비치용 스탬프 적립 QR</h3>
      </div>

      <div className="flex flex-col items-center gap-6">
        {/* QR Code image */}
        <div className="p-3 bg-stone-100 rounded-2xl border border-stone-200/60 shadow-inner shrink-0">
          {qrSrc ? (
            <img
              src={qrSrc}
              alt="Store Stamp QR Code"
              className="w-40 h-40 object-contain select-none bg-white rounded-xl"
            />
          ) : (
            <div className="w-40 h-40 bg-stone-200 animate-pulse rounded-xl" />
          )}
        </div>

        {/* Info & links */}
        <div className="min-w-0 w-full space-y-4">
          <div className="space-y-1">
            <h4 className="font-bold text-stone-900 text-sm">고객 셀프 적립 QR 코드</h4>
            <p className="text-xs text-stone-500 leading-normal break-words">
              이 QR 코드를 카운터, 테이블 등에 출력하여 비치해 주세요.
              고객이 스마트폰으로 스캔하면 별도 가입 절차 없이 휴대폰 번호 입력만으로 간편하게 스탬프를 적립할 수 있습니다.
            </p>
          </div>

          {/* URL Input Copy */}
          <div className="min-w-0 space-y-1">
            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wide">고객 스탬프 적립 URL</label>
            <div className="flex min-w-0 items-center gap-2">
              <input
                type="text"
                readOnly
                value={stampUrl}
                className="min-w-0 flex-1 text-xs font-mono px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="p-2 border border-stone-200 hover:border-stone-400 hover:bg-stone-50 rounded-xl text-stone-500 hover:text-stone-800 transition-all shrink-0"
                title="URL 복사"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={!qrSrc}
            className="w-full px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span className="text-center">QR 코드 고해상도 이미지 다운로드 (.svg)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
