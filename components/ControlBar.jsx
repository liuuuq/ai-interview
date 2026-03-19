'use client';

import { Mic, Square, Ban, Volume2, VolumeX } from 'lucide-react';

export default function ControlBar({
  isListening,
  onToggleMic,
  ttsEnabled,
  onToggleTTS,
  isSpeechSupported,
}) {
  return (
    <div className="control-bar">
      {/* TTS 开关 */}
      <button
        className={`tts-toggle ${ttsEnabled ? 'active' : ''}`}
        onClick={onToggleTTS}
        title={ttsEnabled ? '关闭语音播报' : '开启语音播报'}
      >
        <span className="tts-toggle-icon">
          {ttsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </span>
        <span className="tts-toggle-text">
          {ttsEnabled ? '播报开' : '播报关'}
        </span>
      </button>

      {/* 麦克风按钮 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <button
          className={`mic-button ${isListening ? 'recording' : ''}`}
          onClick={onToggleMic}
          disabled={!isSpeechSupported}
          title={isListening ? '停止录音' : '开始录音'}
        >
          {!isSpeechSupported ? <Ban size={28} /> : isListening ? <Square size={28} fill="currentColor" /> : <Mic size={28} />}
        </button>
        <span className={`mic-status ${isListening ? 'recording' : ''}`}>
          {!isSpeechSupported
            ? '不支持'
            : isListening
            ? '● 录音中'
            : '按下开始'}
        </span>
      </div>

      {/* 占位，保持布局对称 */}
      <div style={{ width: '80px' }}></div>
    </div>
  );
}
