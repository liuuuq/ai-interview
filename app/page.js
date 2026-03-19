'use client';

import { useState, useCallback, useRef } from 'react';
import { Mic } from 'lucide-react';
import InterviewPanel from '@/components/InterviewPanel';
import ControlBar from '@/components/ControlBar';
import SubtitleBar from '@/components/SubtitleBar';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTTS } from '@/hooks/useTTS';
import { INTERVIEW_MODES, getModeById } from '@/config/prompts';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [currentMode, setCurrentMode] = useState('personality');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const pendingTextRef = useRef('');
  const debounceTimerRef = useRef(null);

  const { speak, ttsEnabled, toggleTTS } = useTTS();

  // 发送消息给 AI
  const sendToAI = useCallback(async (userText, allMessages) => {
    const mode = getModeById(currentMode);

    const newMessages = [
      ...allMessages,
      { role: 'user', content: userText },
    ];
    setMessages(newMessages);
    setIsAiTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          systemPrompt: mode.systemPrompt,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || '请求失败');
      }

      // 流式读取
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiText = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      setIsAiTyping(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                aiText += parsed.text;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: aiText,
                  };
                  return updated;
                });
              }
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              if (e.message && !e.message.includes('JSON')) {
                throw e;
              }
            }
          }
        }
      }

      // AI 回复完成后播报
      if (aiText) {
        speak(aiText);
      }
    } catch (error) {
      console.error('AI 请求错误:', error);
      setIsAiTyping(false);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ 出错了：${error.message}`,
        },
      ]);
    }
  }, [currentMode, speak]);

  // 处理语音识别结果（带防抖）
  const handleSpeechResult = useCallback((text) => {
    pendingTextRef.current += text;

    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 1.5秒内没有新的语音识别结果就发送给 AI
    debounceTimerRef.current = setTimeout(() => {
      const finalText = pendingTextRef.current.trim();
      if (finalText) {
        setMessages(prev => {
          sendToAI(finalText, prev);
          return prev;
        });
        pendingTextRef.current = '';
      }
    }, 1500);
  }, [sendToAI]);

  const {
    isListening,
    interimText,
    isSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    lang: 'zh-CN',
    onResult: handleSpeechResult,
  });

  // 切换麦克风
  const toggleMic = useCallback(() => {
    if (isListening) {
      stopListening();
      // 如果有待发送的文字，立即发送
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      const finalText = pendingTextRef.current.trim();
      if (finalText) {
        setMessages(prev => {
          sendToAI(finalText, prev);
          return prev;
        });
        pendingTextRef.current = '';
      }
    } else {
      // 如果是第一条消息，先让 AI 打招呼
      if (messages.length === 0) {
        const mode = getModeById(currentMode);
        setIsAiTyping(true);
        
        // 伪造一条 user 消息来启动对话，以满足 Gemini API 的要求
        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: '您好，我已经准备好开始了。' }],
            systemPrompt: mode.systemPrompt,
          }),
        })
          .then(async (response) => {
            if (!response.ok) {
              const err = await response.json();
              throw new Error(err.error || '请求失败');
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiText = '';

            setMessages([{ role: 'assistant', content: '' }]);
            setIsAiTyping(false);

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') break;
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.text) {
                      aiText += parsed.text;
                      setMessages([{
                        role: 'assistant',
                        content: aiText,
                      }]);
                    }
                  } catch (e) {
                    // 忽略 parse 错误
                  }
                }
              }
            }
            if (aiText) speak(aiText);
          })
          .catch((error) => {
            setIsAiTyping(false);
            setMessages([{
              role: 'assistant',
              content: `⚠️ 出错了：${error.message}`,
            }]);
          });
      }
      startListening();
    }
  }, [isListening, stopListening, startListening, messages, currentMode, sendToAI, speak]);

  // 切换模式
  const handleModeChange = useCallback((e) => {
    const newMode = e.target.value;
    setCurrentMode(newMode);
    // 切换模式时清空对话
    setMessages([]);
    pendingTextRef.current = '';
    if (isListening) stopListening();
  }, [isListening, stopListening]);

  return (
    <>
      {/* 星星背景装饰 */}
      <div className="stars">
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
      </div>

      {/* CRT 扫描线 */}
      <div className="scanlines"></div>

      {/* 主应用 */}
      <div className="app-container">
        {/* 顶部导航 */}
        <header className="header">
          <h1 className="header-title">
            <span className="mic-icon"><Mic size={20} /></span>
            AI 访谈
          </h1>
          <select
            className="mode-selector"
            value={currentMode}
            onChange={handleModeChange}
          >
            {INTERVIEW_MODES.map(mode => (
              <option key={mode.id} value={mode.id}>
                {mode.label}
              </option>
            ))}
          </select>
        </header>

        {/* 对话面板 */}
        <InterviewPanel messages={messages} isAiTyping={isAiTyping} />

        {/* 字幕栏 */}
        <SubtitleBar interimText={interimText} isListening={isListening} />

        {/* 控制栏 */}
        <ControlBar
          isListening={isListening}
          onToggleMic={toggleMic}
          ttsEnabled={ttsEnabled}
          onToggleTTS={toggleTTS}
          isSpeechSupported={isSupported}
        />
      </div>
    </>
  );
}
