'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  sendChatMessage, 
  submitChatFeedback,
  ChatMessage,
  ChatResponse,
  isAuthenticated 
} from '@/lib/api';
import { useRouter } from 'next/navigation';

interface SupportChatWidgetProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

type Position = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export default function SupportChatWidget({ 
  isOpen: externalIsOpen, 
  onToggle: externalOnToggle 
}: SupportChatWidgetProps = {}) {
  const router = useRouter();
  
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const toggleOpen = externalOnToggle || (() => setInternalIsOpen(!internalIsOpen));
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Drag state - only edge positions allowed
  const [position, setPosition] = useState<Position>('bottom-right');
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'bot',
        message: "Hi! I'm your Lyvo support assistant. How can I help you today?",
        created_at: new Date().toISOString()
      }]);
    }
  }, [isOpen]);
  
  // Get CSS position based on edge position
  const getPositionStyles = (pos: Position, dragging: boolean = false) => {
    const offset = 24; // 24px from edges
    
    if (dragging) {
      // Show at drag position while dragging
      return {
        position: 'fixed' as const,
        left: `${dragPosition.x}px`,
        top: `${dragPosition.y}px`,
        transform: 'translate(-50%, -50%)'
      };
    }
    
    // Snap to edges
    switch (pos) {
      case 'bottom-right':
        return { position: 'fixed' as const, right: `${offset}px`, bottom: `${offset}px` };
      case 'bottom-left':
        return { position: 'fixed' as const, left: `${offset}px`, bottom: `${offset}px` };
      case 'top-right':
        return { position: 'fixed' as const, right: `${offset}px`, top: `${offset}px` };
      case 'top-left':
        return { position: 'fixed' as const, left: `${offset}px`, top: `${offset}px` };
    }
  };
  
  // Determine nearest edge position based on drag coordinates
  const getNearestEdgePosition = (x: number, y: number): Position => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    const isLeft = x < windowWidth / 2;
    const isTop = y < windowHeight / 2;
    
    if (isTop && isLeft) return 'top-left';
    if (isTop && !isLeft) return 'top-right';
    if (!isTop && isLeft) return 'bottom-left';
    return 'bottom-right';
  };
  
  // Drag handlers - Mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return;
    e.preventDefault();
    setIsDragging(true);
    setDragPosition({ x: e.clientX, y: e.clientY });
  };
  
  // Drag handlers - Touch
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isOpen) return;
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    setDragPosition({ x: touch.clientX, y: touch.clientY });
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setDragPosition({ x: e.clientX, y: e.clientY });
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      setDragPosition({ x: touch.clientX, y: touch.clientY });
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging) return;
      
      // Snap to nearest edge
      const nearestEdge = getNearestEdgePosition(e.clientX, e.clientY);
      setPosition(nearestEdge);
      setIsDragging(false);
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDragging) return;
      
      const touch = e.changedTouches[0];
      const nearestEdge = getNearestEdgePosition(touch.clientX, touch.clientY);
      setPosition(nearestEdge);
      setIsDragging(false);
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging]);
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    if (!isAuthenticated()) {
      router.push('/auth/signin?redirect=/dashboard');
      return;
    }
    
    const userMessage = inputMessage.trim();
    setInputMessage('');
    setError(null);
    
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      message: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setIsTyping(true);
    
    try {
      const response: ChatResponse = await sendChatMessage(userMessage, conversationId);
      
      if (!conversationId) {
        setConversationId(response.conversation_id);
      }
      
      const botMessage: ChatMessage = {
        id: response.message_id || `bot-${Date.now()}`,
        role: 'bot',
        message: response.message,
        bot_confidence: response.confidence,
        source: response.tools_used.length > 0 ? 'tools' : 'knowledge',
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      if (response.type === 'escalate' && response.ticket_id) {
        const escalationMsg: ChatMessage = {
          id: `escalation-${Date.now()}`,
          role: 'bot',
          message: `✅ Support ticket #${response.ticket_id.substring(0, 8)} created. Check your email for updates!`,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, escalationMsg]);
      }
      
    } catch (err: any) {
      setError('Oops! Something went wrong. Failed to send message');
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleFeedback = async (messageId: string, helpful: boolean) => {
    try {
      await submitChatFeedback(messageId, helpful);
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, was_helpful: helpful } : msg
      ));
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get chat window position based on button position
  const getChatWindowStyles = () => {
    const offset = 24;
    const buttonSize = 64;
    const gap = 16;
    
    switch (position) {
      case 'bottom-right':
        return { position: 'fixed' as const, right: `${offset}px`, bottom: `${offset + buttonSize + gap}px` };
      case 'bottom-left':
        return { position: 'fixed' as const, left: `${offset}px`, bottom: `${offset + buttonSize + gap}px` };
      case 'top-right':
        return { position: 'fixed' as const, right: `${offset}px`, top: `${offset + buttonSize + gap}px` };
      case 'top-left':
        return { position: 'fixed' as const, left: `${offset}px`, top: `${offset + buttonSize + gap}px` };
    }
  };
  
  return (
    <>
      {/* Floating Button - Snaps to edges */}
      {externalIsOpen === undefined && !isOpen && (
        <button
          ref={buttonRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={(e) => {
            if (!isDragging) {
              toggleOpen();
            }
          }}
          style={{
            ...getPositionStyles(position, isDragging),
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            opacity: isDragging ? 0.7 : 1,
            transition: isDragging ? 'none' : 'all 0.3s ease'
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:scale-110 z-50 select-none"
          aria-label="Open support chat"
        >
          <svg
            className="w-6 h-6 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>
      )}
      
      {/* Chat Window */}
      {isOpen && (
        <div 
          style={getChatWindowStyles()}
          className="lg:w-96 w-[calc(100vw-48px)] max-w-96 h-[600px] max-h-[80vh] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200"
        >
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <div>
                <h3 className="font-semibold">Lyvo Support</h3>
                <p className="text-xs text-blue-100">AI Assistant • Online</p>
              </div>
            </div>
            
            <button
              onClick={toggleOpen}
              className="text-white hover:bg-blue-700 rounded-full p-1 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  
                  <p
                    className={`text-xs mt-1 ${
                      msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {formatTime(msg.created_at)}
                  </p>
                  
                  {msg.role === 'bot' && msg.id !== 'welcome' && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500">Helpful?</span>
                      <button
                        onClick={() => handleFeedback(msg.id, true)}
                        disabled={msg.was_helpful !== undefined}
                        className={`text-lg transition ${
                          msg.was_helpful === true
                            ? 'opacity-100'
                            : msg.was_helpful === false
                            ? 'opacity-30'
                            : 'opacity-50 hover:opacity-100'
                        }`}
                      >
                        👍
                      </button>
                      <button
                        onClick={() => handleFeedback(msg.id, false)}
                        disabled={msg.was_helpful !== undefined}
                        className={`text-lg transition ${
                          msg.was_helpful === false
                            ? 'opacity-100'
                            : msg.was_helpful === true
                            ? 'opacity-30'
                            : 'opacity-50 hover:opacity-100'
                        }`}
                      >
                        👎
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                rows={2}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                disabled={isTyping}
              />
              
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 rounded-lg transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
}