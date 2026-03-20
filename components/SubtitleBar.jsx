'use client';

import { Mic } from 'lucide-react';

export default function SubtitleBar({ interimText, isListening }) {
  if (!isListening) {
    return (
      <div className="subtitle-bar">
        <span className="subtitle-idle"><Mic size={14} style={{display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '4px'}} /> 点击麦克风开始说话…</span>
      </div>
    );
  }

  return (
    <div className="subtitle-bar">
      <span className="subtitle-label">识别语音中</span>
      <span className="subtitle-text">
        {interimText || '等待语音输入…'}
        {interimText && <span className="subtitle-cursor"></span>}
      </span>
    </div>
  );
}
