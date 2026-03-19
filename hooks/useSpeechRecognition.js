'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export function useSpeechRecognition({ lang = 'zh-CN', onResult, onEnd }) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);
  const shouldRestartRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimText(interim);

      if (final && onResult) {
        onResult(final);
        setInterimText('');
      }
    };

    recognition.onend = () => {
      // 如果应该继续录音，自动重启
      if (shouldRestartRef.current) {
        try {
          recognition.start();
        } catch (e) {
          // 忽略已启动的错误
        }
      } else {
        setIsListening(false);
        setInterimText('');
        if (onEnd) onEnd();
      }
    };

    recognition.onerror = (event) => {
      // no-speech 和 aborted 是常见的非致命错误
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      console.error('语音识别错误:', event.error);
      if (event.error === 'not-allowed') {
        setIsSupported(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldRestartRef.current = false;
      try {
        recognition.stop();
      } catch (e) {
        // 忽略
      }
    };
  }, [lang]);

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    shouldRestartRef.current = true;
    try {
      recognition.start();
      setIsListening(true);
    } catch (e) {
      // 可能已经在运行
    }
  }, []);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    shouldRestartRef.current = false;
    try {
      recognition.stop();
    } catch (e) {
      // 忽略
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  return {
    isListening,
    interimText,
    isSupported,
    startListening,
    stopListening,
  };
}
