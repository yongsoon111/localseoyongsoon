'use client';

import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Download, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReviewQRGeneratorProps {
  placeId: string;
  businessName: string;
}

export function ReviewQRGenerator({ placeId, businessName }: ReviewQRGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [size, setSize] = useState(200);
  const qrRef = useRef<HTMLDivElement>(null);

  // Google 리뷰 작성 URL
  const reviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(reviewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPNG = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    img.onload = () => {
      canvas.width = size * 2;
      canvas.height = size * 2;

      // 흰색 배경
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(img, 0, 0, size * 2, size * 2);

      const link = document.createElement('a');
      link.download = `${businessName.replace(/\s+/g, '_')}_리뷰QR.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleDownloadSVG = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `${businessName.replace(/\s+/g, '_')}_리뷰QR.svg`;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
          <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">리뷰 QR 코드</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">고객이 스캔하면 바로 리뷰 작성 페이지로 이동</p>
        </div>
      </div>

      {/* QR 코드 */}
      <div className="flex flex-col items-center mb-6">
        <div
          ref={qrRef}
          className="bg-white p-4 rounded-2xl shadow-lg border-4 border-slate-100 dark:border-slate-600"
        >
          <QRCodeSVG
            value={reviewUrl}
            size={size}
            level="H"
            includeMargin={true}
            bgColor="#FFFFFF"
            fgColor="#000000"
          />
        </div>
        <p className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-300 text-center">
          {businessName}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Google 리뷰 작성하기
        </p>
      </div>

      {/* 크기 조절 */}
      <div className="mb-6">
        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          QR 크기
        </label>
        <div className="flex gap-2 mt-2">
          {[150, 200, 300, 400].map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                size === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {s}px
            </button>
          ))}
        </div>
      </div>

      {/* URL 표시 및 복사 */}
      <div className="mb-6">
        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          리뷰 링크
        </label>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-300 truncate">
            {reviewUrl}
          </div>
          <Button
            onClick={handleCopyUrl}
            variant="outline"
            size="sm"
            className="shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>
          <a
            href={reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>

      {/* 다운로드 버튼 */}
      <div className="flex gap-3">
        <Button
          onClick={handleDownloadPNG}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          PNG 다운로드
        </Button>
        <Button
          onClick={handleDownloadSVG}
          variant="outline"
          className="flex-1"
        >
          <Download className="w-4 h-4 mr-2" />
          SVG 다운로드
        </Button>
      </div>

      {/* 사용 팁 */}
      <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">💡 활용 팁</p>
        <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <li>• 계산대, 테이블 텐트, 영수증에 인쇄하세요</li>
          <li>• 명함이나 홍보물에 추가하세요</li>
          <li>• SNS나 웹사이트에 공유하세요</li>
        </ul>
      </div>
    </div>
  );
}
