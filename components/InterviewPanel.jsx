'use client';

import { useEffect, useRef } from 'react';
import { Bot, User } from 'lucide-react';

export default function InterviewPanel({ messages, isAiTyping }) {
  const panelRef = useRef(null);

  // 自动滚到最新消息
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [messages, isAiTyping]);

  if (messages.length === 0 && !isAiTyping) {
    return (
      <div className="chat-panel" ref={panelRef}>
        <div className="empty-state">
          <div className="empty-state-icon"><Bot size={48} /></div>
          <div className="empty-state-text">
            点击麦克风按钮
            <br />
            开始 AI 访谈
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-panel" ref={panelRef}>
      {messages.map((msg, index) => (
        <div key={index} className={`message ${msg.role === 'user' ? 'user' : 'ai'}`}>
          <div className="message-avatar">
            {msg.role === 'user' ? <User size={24} /> : <Bot size={24} />}
          </div>
          <div className="message-bubble">
            {msg.content}
          </div>
        </div>
      ))}
      {isAiTyping && (
        <div className="message ai">
          <div className="message-avatar"><Bot size={24} /></div>
          <div className="message-bubble">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
