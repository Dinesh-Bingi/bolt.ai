import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Volume2, Users, Circle } from 'lucide-react';
import Button from './ui/Button';
import { realtimeService } from '../lib/realtime';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  hasVoice?: boolean;
  isTyping?: boolean;
}

interface LiveChatProps {
  memorialId: string;
  memorialName: string;
  userId?: string;
  onSendMessage?: (message: string) => Promise<string>;
  onPlayVoice?: (message: string) => void;
}

export default function LiveChat({ 
  memorialId, 
  memorialName, 
  userId, 
  onSendMessage, 
  onPlayVoice 
}: LiveChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hello, I'm ${memorialName}. I'm here to share memories and continue our connection. What would you like to talk about?`,
      isUser: false,
      timestamp: new Date(),
      hasVoice: true
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Subscribe to real-time presence
    const channel = realtimeService.subscribeToMemorial(memorialId, (payload) => {
      if (payload.eventType === 'presence') {
        setOnlineUsers(payload.presence?.length || 0);
      }
    });

    // Update presence
    realtimeService.updatePresence(`memorial:${memorialId}`, {
      user_id: userId || 'anonymous',
      online_at: new Date().toISOString(),
    });

    return () => {
      realtimeService.unsubscribe(`memorial:${memorialId}`);
    };
  }, [memorialId, userId]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    // Add typing indicator
    const typingMessage: Message = {
      id: 'typing',
      content: '',
      isUser: false,
      timestamp: new Date(),
      isTyping: true
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      let response: string;
      
      if (onSendMessage) {
        response = await onSendMessage(inputValue);
      } else if (userId) {
        // Call chat edge function
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
        const headers = {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        };
        
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: inputValue,
            user_id: userId,
          }),
        });
        
        if (!res.ok) {
          throw new Error('Failed to get AI response');
        }
        
        const data = await res.json();
        response = data.response;
      } else {
        throw new Error('No message handler provided');
      }
      
      // Remove typing indicator and add real response
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        isUser: false,
        timestamp: new Date(),
        hasVoice: true
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble responding right now, but know that I'm always here with you in spirit.",
        isUser: false,
        timestamp: new Date(),
        hasVoice: false
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        // Here you would convert speech to text and send as message
        // For now, we'll just indicate voice message was sent
        const voiceMessage: Message = {
          id: Date.now().toString(),
          content: '[Voice message sent]',
          isUser: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, voiceMessage]);
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
      {/* Header with online status */}
      <div className="p-4 border-b border-white/10 bg-black/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Circle className="w-3 h-3 text-green-400 fill-current" />
              <Circle className="w-3 h-3 text-green-400 absolute inset-0 animate-ping" />
            </div>
            <span className="font-medium text-white">{memorialName}</span>
            {isTyping && (
              <span className="text-sm text-gray-400 italic">typing...</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Users className="w-4 h-4" />
            <span>{onlineUsers} online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  message.isUser
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : message.isTyping
                    ? 'bg-white/5 text-gray-100 border border-white/20'
                    : 'bg-white/10 text-gray-100 border border-white/20'
                }`}
              >
                {message.isTyping ? (
                  <div className="flex space-x-1 py-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                        className="w-2 h-2 bg-purple-400 rounded-full"
                      />
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                      {!message.isUser && message.hasVoice && onPlayVoice && (
                        <button
                          onClick={() => onPlayVoice(message.content)}
                          className="p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-black/10">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${memorialName}...`}
              rows={1}
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 resize-none"
            />
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                isRecording ? 'text-red-400 bg-red-400/20' : 'text-gray-400 hover:text-white'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            icon={Send}
            size="md"
            className="px-4"
          />
        </div>
      </div>
    </div>
  );
}