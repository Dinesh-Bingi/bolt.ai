import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Flame, Flower, MessageCircle, Share, Video, Phone } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import HolographicAvatar from '../components/HolographicAvatar';
import LiveChat from '../components/LiveChat';
import CallInterface from '../components/CallInterface';
import ParticleBackground from '../components/ParticleBackground';
import { useMemories } from '../hooks/useMemories';
import { guestbookService } from '../api/guestbook';
import { realtimeService } from '../lib/realtime';
import type { GuestbookEntry } from '../types';

interface MemorialProps {
  memorialId?: string;
  userId?: string;
}

export default function Memorial({ memorialId = 'demo', userId = 'demo' }: MemorialProps) {
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [entryName, setEntryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [onlineVisitors, setOnlineVisitors] = useState(0);
  
  const { generateAIResponse } = useMemories(userId);

  useEffect(() => {
    loadGuestbook();
    
    // Subscribe to real-time guestbook updates
    const channel = realtimeService.subscribeToMemorial(memorialId, (payload) => {
      if (payload.eventType === 'INSERT') {
        setGuestbook(prev => [payload.new, ...prev]);
      }
    });

    return () => {
      realtimeService.unsubscribe(`memorial:${memorialId}`);
    };
  }, [memorialId]);

  const loadGuestbook = async () => {
    try {
      const entries = await guestbookService.getEntries(memorialId);
      setGuestbook(entries);
    } catch (error) {
      console.error('Failed to load guestbook:', error);
    } finally {
      setLoading(false);
    }
  };

  const memorialData = {
    name: 'John Doe',
    tagline: 'Loving Father, Mentor, and Friend',
    dates: '1960 - 2024',
    biography: 'John lived a life full of love, laughter, and wisdom. He touched countless lives through his work as a teacher and his dedication to family.',
    imageUrl: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400'
  };

  const handleSendMessage = async (message: string): Promise<string> => {
    try {
      return await generateAIResponse(message);
    } catch (error) {
      console.error('AI response failed:', error);
      return "I'm having trouble responding right now, but know that I'm always here with you in spirit.";
    }
  };

  const handlePlayVoice = (message: string) => {
    console.log('Playing voice for:', message);
    // Integration with voice API would go here
  };

  const addGuestbookEntry = async (type: 'message' | 'candle' | 'flower') => {
    if (!entryName.trim() || (type === 'message' && !newEntry.trim())) return;

    try {
      const message = type === 'message' ? newEntry : type === 'candle' ? 'lit a candle' : 'left a flower';
      
      const entry = await guestbookService.addEntry(
        memorialId,
        entryName,
        message,
        type
      );

      setGuestbook(prev => [entry, ...prev]);
      setNewEntry('');
      setEntryName('');
    } catch (error) {
      console.error('Failed to add guestbook entry:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white">
      <ParticleBackground />
      
      {/* Header */}
      <header className="relative z-10 p-6 border-b border-white/10 backdrop-blur-sm bg-black/20">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold">⚰️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">In Loving Memory</h1>
              <p className="text-sm text-gray-400">A Digital Legacy</p>
            </div>
          </div>
          
          <Button icon={Share} variant="secondary" size="sm">
            Share Memorial
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 grid lg:grid-cols-3 gap-8">
        {/* Memorial Info */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="text-center">
              <HolographicAvatar
                name={memorialData.name}
                imageUrl={memorialData.imageUrl}
              />
              
              <div className="mt-6">
                <h2 className="text-2xl font-bold mb-2">{memorialData.name}</h2>
                <p className="text-gray-300 mb-1">{memorialData.tagline}</p>
                <p className="text-sm text-gray-400">{memorialData.dates}</p>
              </div>
            </GlassCard>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard>
              <h3 className="text-lg font-semibold mb-4">Leave a Tribute</h3>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Your name"
                  value={entryName}
                  onChange={(e) => setEntryName(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                />
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Flame}
                    onClick={() => addGuestbookEntry('candle')}
                    className="flex-1"
                  >
                    Light Candle
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Flower}
                    onClick={() => addGuestbookEntry('flower')}
                    className="flex-1"
                  >
                    Leave Flower
                  </Button>
                </div>
                
                <textarea
                  placeholder="Share a memory or message..."
                  value={newEntry}
                  onChange={(e) => setNewEntry(e.target.value)}
                  rows={3}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 resize-none"
                />
                
                <Button
                  onClick={() => addGuestbookEntry('message')}
                  disabled={!entryName.trim() || !newEntry.trim()}
                  icon={MessageCircle}
                  className="w-full"
                >
                  Share Message
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard>
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Connect with {memorialData.name}
              </h3>
              
              {/* Call Interface */}
              <div className="mb-6">
                <CallInterface
                  memorialName={memorialData.name}
                  memorialId={memorialId}
                  userId={userId}
                  avatarUrl={memorialData.imageUrl}
                  onSendMessage={handleSendMessage}
                />
              </div>
              
              {/* Chat Interface */}
              <LiveChat
                memorialId={memorialId}
                memorialName={memorialData.name}
                userId={userId}
                onPlayVoice={handlePlayVoice}
              />
            </GlassCard>
          </motion.div>

          {/* Guestbook */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard>
              <h3 className="text-xl font-semibold mb-6">Messages of Love</h3>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {guestbook.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{entry.name}</span>
                        {entry.type === 'candle' && <Flame className="w-4 h-4 text-orange-400" />}
                        {entry.type === 'flower' && <Flower className="w-4 h-4 text-pink-400" />}
                        {entry.type === 'message' && <Heart className="w-4 h-4 text-red-400" />}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">{entry.message}</p>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}