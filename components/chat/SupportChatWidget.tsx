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

function ThumbUp({ active }: { active: boolean }) {
  return (
    <svg className="w-4 h-4" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
    </svg>
  );
}

function ThumbDown({ active }: { active: boolean }) {
  return (
    <svg className="w-4 h-4" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15h2.25m8.024-9.75c.011.05.028.1.052.148.591 1.2.924 2.55.924 3.977a8.96 8.96 0 01-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398C20.613 13.797 19.833 14.25 19 14.25h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 00.303-.54m.023-8.25H16.48a4.5 4.5 0 01-1.423-.23l-3.114-1.04a4.5 4.5 0 00-1.423-.23H6.504c-.618 0-1.217.247-1.605.729A11.95 11.95 0 002.25 12c0 .434.023.863.068 1.285C2.427 14.306 3.346 15 4.372 15h3.126c.618 0 .991.724.725 1.282A7.471 7.471 0 007.5 19.5a2.25 2.25 0 002.25 2.25.75.75 0 00.75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 002.86-2.4c.498-.634 1.226-1.08 2.032-1.08z" />
    </svg>
  );
}

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
          message: `Support ticket #${response.ticket_id.substring(0, 8)} created. Check your email for updates.`,
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
          className="bg-invert text-invert rounded-full p-4 hover:opacity-90 z-50 select-none"
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
          className="lg:w-96 w-[calc(100vw-48px)] max-w-96 h-[600px] max-h-[80vh] bg-surface flex flex-col z-50 border border-default"
        >
          {/* Header */}
          <div className="bg-invert text-invert p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <div>
                <h3 className="font-amiamie text-base">Lyvo Support</h3>
                <p className="font-[ArchivoBlack] text-[9px] tracking-[0.15em] uppercase opacity-70">
                  AI Assistant · Online
                </p>
              </div>
            </div>
            
            <button
              onClick={toggleOpen}
              className="opacity-80 hover:opacity-100 p-1 transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 ${
                    msg.role === 'user'
                      ? 'bg-invert text-invert'
                      : 'bg-surface text-primary border border-default'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  
                  <p
                    className={`text-xs mt-1 ${
                      msg.role === 'user' ? 'opacity-70' : 'text-muted'
                    }`}
                  >
                    {formatTime(msg.created_at)}
                  </p>
                  
                  {msg.role === 'bot' && msg.id !== 'welcome' && (
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-default">
                      <span className="text-xs text-muted">Helpful?</span>
                      <button
                        onClick={() => handleFeedback(msg.id, true)}
                        disabled={msg.was_helpful !== undefined}
                        className={`transition-colors ${
                          msg.was_helpful === true
                            ? 'text-accent'
                            : msg.was_helpful === false
                            ? 'text-muted opacity-40'
                            : 'text-muted hover:text-accent'
                        }`}
                        aria-label="Mark as helpful"
                      >
                        <ThumbUp active={msg.was_helpful === true} />
                      </button>
                      <button
                        onClick={() => handleFeedback(msg.id, false)}
                        disabled={msg.was_helpful !== undefined}
                        className={`transition-colors ${
                          msg.was_helpful === false
                            ? 'text-danger'
                            : msg.was_helpful === true
                            ? 'text-muted opacity-40'
                            : 'text-muted hover:text-danger'
                        }`}
                        aria-label="Mark as not helpful"
                      >
                        <ThumbDown active={msg.was_helpful === false} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-surface border border-default p-3">
                  <div className="flex space-x-2">
                    <div className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="pt-3 border-t border-danger">
                <p className="text-sm text-secondary">{error}</p>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="p-4 border-t border-default bg-surface">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                rows={2}
                className="flex-1 bg-transparent border-b border-default focus:border-accent focus:outline-none resize-none text-sm text-primary placeholder:text-muted px-1 pb-1"
                disabled={isTyping}
              />
              
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="bg-invert text-invert disabled:bg-border disabled:text-muted disabled:cursor-not-allowed px-4 hover:opacity-90 transition-opacity"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            
            <p className="text-xs text-muted mt-2">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
}