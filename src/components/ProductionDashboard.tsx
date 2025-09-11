import React, { useState, useEffect } from 'react';
import { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, MessageCircle, Settings, User, Crown, Mic, CreditCard, 
  Video, BarChart3, Users, Globe, Shield, Bell
} from 'lucide-react';
import GlassCard from './ui/GlassCard';
import Button from './ui/Button';
import StepperForm from './StepperForm';
import HolographicAvatar from './HolographicAvatar';
import UploadZone from './UploadZone';
import SubscriptionManager from './SubscriptionManager';
import VideoGenerator from './VideoGenerator';
import RealTimeNotifications from './RealTimeNotifications';
import { useAuth } from '../hooks/useAuth';
import { useMemories } from '../hooks/useMemories';
import { voiceService } from '../api/voice';
import { avatarService } from '../api/avatar';
import { memorialService } from '../api/memorial';

interface ProductionDashboardProps {
  onNavigateToMemorial: () => void;
}

export default function ProductionDashboard({ onNavigateToMemorial }: ProductionDashboardProps) {
  const { user, signOut } = useAuth();
  const { memories, saveMemories, loading: memoriesLoading } = useMemories(user?.id || null);
  const [activeTab, setActiveTab] = useState('overview');
  const [memorial, setMemorial] = useState<any>(null);
  const [stats, setStats] = useState({
    totalVisitors: 0,
    messagesReceived: 0,
    videosGenerated: 0,
    memoryCompletion: 0
  });

  const loadDashboardData = useCallback(async () => {
    if (!user) return;


    try {
      // Load user's memorial
      const userMemorial = await memorialService.getUserMemorial(user.id);
      setMemorial(userMemorial);

      // Calculate stats
      const memoryCompletion = memories.length > 0 ? (memories.length / 6) * 100 : 0;
      
      setStats({
        totalVisitors: Math.floor(Math.random() * 100) + 50, // Demo data
        messagesReceived: Math.floor(Math.random() * 20) + 5,
        videosGenerated: Math.floor(Math.random() * 10) + 2,
        memoryCompletion: Math.round(memoryCompletion)
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }, [user, memories.length]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  const handleStoryComplete = useCallback(async (answers: Record<string, string>) => {
    if (!user) return;
    
    try {
      await saveMemories(answers);
      
      // Create memorial if it doesn't exist
      if (!memorial) {
        const newMemorial = await memorialService.createMemorial(
          user.id,
          `${user.name}'s Memorial`,
          `A digital legacy preserving the memories and wisdom of ${user.name}`
        );
        setMemorial(newMemorial);
      }
      
      setActiveTab('uploads');
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to complete story:', error);
    }
  }, [user, saveMemories, memorial, loadDashboardData]);

  const handleVoiceUpload = async (files: File[]) => {
    if (!user) return;
    
    try {
      await voiceService.cloneVoice(user.id, user.name, files);
      await loadDashboardData();
    } catch (error) {
      console.error('Voice upload failed:', error);
    }
  };

  const handleAvatarUpload = async (files: File[]) => {
    if (!user) return;
    
    try {
      await avatarService.createAvatar(user.id, files[0]);
      await loadDashboardData();
    } catch (error) {
      console.error('Avatar upload failed:', error);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'story', label: 'Life Story', icon: MessageCircle },
    { id: 'uploads', label: 'Media', icon: Upload },
    { id: 'videos', label: 'AI Videos', icon: Video },
    { id: 'memorial', label: 'Memorial Page', icon: Globe },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const getCompletionStatus = () => {
    const hasStory = memories.length >= 6;
    const hasAvatar = user?.avatar;
    const hasVoice = true; // Would check voice_clones table
    
    return {
      story: hasStory,
      avatar: !!hasAvatar,
      voice: hasVoice,
      overall: hasStory && hasAvatar && hasVoice
    };
  };

  const completion = getCompletionStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white">
      {/* Remove ParticleBackground from dashboard for better performance */}
      
      {/* Header */}
      <header className="relative z-10 p-6 border-b border-white/10 backdrop-blur-sm bg-black/20">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold">⚰️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Legacy.ai Dashboard</h1>
              <p className="text-sm text-gray-400">Building your digital immortality</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <RealTimeNotifications userId={user?.id || ''} memorialId={memorial?.id} />
            
            {memorial && (
              <Button onClick={onNavigateToMemorial} size="sm" icon={Globe}>
                View Memorial
              </Button>
            )}
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm">{user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto p-6 space-x-6">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-64 space-y-4"
        >
          {/* User Profile Card */}
          <GlassCard>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full mx-auto mb-3 flex items-center justify-center">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-8 h-8" />
                )}
              </div>
              <h3 className="font-semibold">{user?.name || 'User'}</h3>
              <div className="flex items-center justify-center space-x-1 mt-1">
                <Crown className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-400 capitalize">{user?.subscription || 'Free'} Plan</span>
              </div>
            </div>
            
            {/* Completion Progress */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Profile Completion</span>
                <span>{Math.round((Object.values(completion).filter(Boolean).length / 4) * 100)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(Object.values(completion).filter(Boolean).length / 4) * 100}%` }}
                />
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="mt-4 text-xs w-full"
            >
              Sign Out
            </Button>
          </GlassCard>

          {/* Navigation */}
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-purple-600/50 text-white border border-purple-400/50'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
                {tab.id === 'story' && !completion.story && (
                  <div className="w-2 h-2 bg-red-400 rounded-full" />
                )}
                {tab.id === 'uploads' && (!completion.avatar || !completion.voice) && (
                  <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">Dashboard Overview</h2>
                <p className="text-gray-300">
                  Track your digital legacy progress and engagement.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { label: 'Memorial Visitors', value: stats.totalVisitors, icon: Users, color: 'text-blue-400' },
                  { label: 'Messages Received', value: stats.messagesReceived, icon: MessageCircle, color: 'text-green-400' },
                  { label: 'Videos Generated', value: stats.videosGenerated, icon: Video, color: 'text-purple-400' },
                  { label: 'Story Completion', value: `${stats.memoryCompletion}%`, icon: BarChart3, color: 'text-yellow-400' }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <GlassCard hover>
                      <div className="flex items-center space-x-3">
                        <stat.icon className={`w-8 h-8 ${stat.color}`} />
                        <div>
                          <p className="text-2xl font-bold text-white">{stat.value}</p>
                          <p className="text-sm text-gray-400">{stat.label}</p>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>

              {/* Quick Actions */}
              <GlassCard>
                <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {!completion.story && (
                    <Button
                      onClick={() => setActiveTab('story')}
                      variant="secondary"
                      icon={MessageCircle}
                      className="justify-start"
                    >
                      Complete Life Story
                    </Button>
                  )}
                  {!completion.avatar && (
                    <Button
                      onClick={() => setActiveTab('uploads')}
                      variant="secondary"
                      icon={Upload}
                      className="justify-start"
                    >
                      Upload Avatar
                    </Button>
                  )}
                  {completion.overall && (
                    <Button
                      onClick={() => setActiveTab('videos')}
                      variant="primary"
                      icon={Video}
                      className="justify-start"
                    >
                      Generate AI Video
                    </Button>
                  )}
                </div>
              </GlassCard>

              {/* Memorial Link */}
              {memorial && (
                <GlassCard>
                  <h3 className="text-xl font-semibold mb-4">Your Memorial</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{memorial.title}</p>
                      <p className="text-sm text-gray-400">
                        Share this link with family: 
                        <code className="ml-2 bg-white/10 px-2 py-1 rounded text-purple-300">
                          legacy.ai/memorial/{memorial.slug}
                        </code>
                      </p>
                    </div>
                    <Button onClick={onNavigateToMemorial} icon={Globe}>
                      Visit Memorial
                    </Button>
                  </div>
                </GlassCard>
              )}
            </motion.div>
          )}

          {activeTab === 'story' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">Tell Your Life Story</h2>
                <p className="text-gray-300">
                  Share your memories, experiences, and wisdom to create your digital essence.
                </p>
              </div>
              <StepperForm onComplete={handleStoryComplete} loading={memoriesLoading} />
            </motion.div>
          )}

          {activeTab === 'uploads' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">Upload Your Media</h2>
                <p className="text-gray-300">
                  Upload photos and voice recordings to enhance your digital avatar.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <UploadZone
                  accept="image/*"
                  maxSize={10 * 1024 * 1024}
                  onUpload={handleAvatarUpload}
                  title="Avatar Photo"
                  description="Upload a clear photo for your 3D avatar"
                  icon={User}
                />

                <UploadZone
                  accept="audio/*"
                  maxSize={50 * 1024 * 1024}
                  multiple
                  onUpload={handleVoiceUpload}
                  title="Voice Samples"
                  description="Upload clear voice recordings (5+ minutes total)"
                  icon={Mic}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'videos' && user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">AI Video Generation</h2>
                <p className="text-gray-300">
                  Create personalized videos with your voice and avatar.
                </p>
              </div>
              <VideoGenerator userId={user.id} userName={user.name} />
            </motion.div>
          )}

          {activeTab === 'memorial' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">Memorial Page Management</h2>
                <p className="text-gray-300">
                  Customize how your memorial appears to visitors.
                </p>
              </div>

              {memorial ? (
                <div className="space-y-6">
                  <GlassCard>
                    <h3 className="text-xl font-semibold mb-4">Memorial Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Memorial Title
                        </label>
                        <input
                          type="text"
                          defaultValue={memorial.title}
                          className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          defaultValue={memorial.description}
                          rows={3}
                          className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-400 resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Public Memorial</p>
                          <p className="text-sm text-gray-400">Allow anyone to visit your memorial page</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            defaultChecked={memorial.is_public}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    </div>
                    
                    <Button className="mt-4">Save Changes</Button>
                  </GlassCard>

                  <GlassCard>
                    <h3 className="text-xl font-semibold mb-4">Share Your Memorial</h3>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <p className="text-sm text-gray-400 mb-2">Memorial URL:</p>
                      <div className="flex items-center space-x-2">
                        <code className="flex-1 bg-black/20 px-3 py-2 rounded text-purple-300 text-sm">
                          https://legacy.ai/memorial/{memorial.slug}
                        </code>
                        <Button size="sm" variant="secondary">Copy Link</Button>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              ) : (
                <GlassCard>
                  <div className="text-center py-8">
                    <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Memorial Created</h3>
                    <p className="text-gray-400 mb-4">
                      Complete your life story first to create your memorial page.
                    </p>
                    <Button onClick={() => setActiveTab('story')} icon={MessageCircle}>
                      Start Life Story
                    </Button>
                  </div>
                </GlassCard>
              )}
            </motion.div>
          )}

          {activeTab === 'subscription' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">Subscription Management</h2>
                <p className="text-gray-300">
                  Manage your Legacy.ai subscription and billing.
                </p>
              </div>
              <SubscriptionManager />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">Account Settings</h2>
                <p className="text-gray-300">
                  Manage your account preferences and privacy settings.
                </p>
              </div>

              <GlassCard>
                <h3 className="text-xl font-semibold mb-4">Privacy & Security</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-400">Add an extra layer of security</p>
                    </div>
                    <Button variant="secondary" size="sm">Enable 2FA</Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Data Export</p>
                      <p className="text-sm text-gray-400">Download all your data</p>
                    </div>
                    <Button variant="secondary" size="sm">Export Data</Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Delete Account</p>
                      <p className="text-sm text-gray-400">Permanently delete your legacy</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}