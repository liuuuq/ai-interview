'use client';

import { useState, useRef, useCallback } from 'react';

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const utteranceRef = useRef(null);

  const speak = useCallback((text) => {
    if (!ttsEnabled) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // 停止之前的播报
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // 尝试使用中文语音
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.startsWith('zh'));
    if (zhVoice) {
      utterance.voice = zhVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled]);

  const stop = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const init = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    // 播放一段静音的空白文本来获取浏览器的语音播放权限
    const utterance = new SpeechSynthesisUtterance(' ');
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
  }, []);

  const toggleTTS = useCallback(() => {
    setTtsEnabled(prev => {
      if (prev) {
        // 关闭时停止当前播报
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
      }
      return !prev;
    });
  }, []);

  return {
    isSpeaking,
    ttsEnabled,
    speak,
    stop,
    toggleTTS,
    init,
  };
}
