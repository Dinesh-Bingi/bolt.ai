import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Play, Download, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import Button from './ui/Button';
import GlassCard from './ui/GlassCard';
import { videoGenerationService } from '../lib/videoGeneration';
import { realtimeService } from '../lib/realtime';
import type { VideoGenerationResult } from '../lib/videoGeneration';

interface VideoGeneratorProps {
  userId: string;
  userName: string;
}

export default function VideoGenerator({ userId, userName }: VideoGeneratorProps) {
  const [text, setText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<VideoGenerationResult | null>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);

  useEffect(() => {
    loadUserVideos();
    
    // Subscribe to real-time updates
    const channel = realtimeService.subscribeToUser(userId, (payload) => {
      if (payload.table === 'video_generations') {
        loadUserVideos();
      }
    });

    return () => {
      realtimeService.unsubscribe(`user:${userId}`);
    };
  }, [userId]);

  const loadUserVideos = async () => {
    try {
      const userVideos = await videoGenerationService.getUserVideos(userId);
      setVideos(userVideos);
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setLoadingVideos(false);
    }
  };

  const generateVideo = async () => {
    if (!text.trim()) return;

    setGenerating(true);
    try {
      const result = await videoGenerationService.generateVideo({
        userId,
        text: text.trim(),
      });

      setCurrentVideo(result);
      
      // Poll for completion
      pollVideoStatus(result.videoId);
      
      // Clear text and reload videos
      setText('');
      await loadUserVideos();
    } catch (error: any) {
      console.error('Video generation failed:', error);
      alert(error.message || 'Failed to generate video. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const pollVideoStatus = async (videoId: string) => {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        const result = await videoGenerationService.checkVideoStatus(videoId);
        setCurrentVideo(result);

        if (result.status === 'completed' || result.status === 'failed') {
          await loadUserVideos();
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Check every 5 seconds
        }
      } catch (error) {
        console.error('Status check failed:', error);
      }
    };

    poll();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Loader className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatDuration = (createdAt: string, completedAt?: string) => {
    const start = new Date(createdAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const duration = Math.round((end.getTime() - start.getTime()) / 1000);
    
    if (duration < 60) return `${duration}s`;
    return `${Math.round(duration / 60)}m`;
  };

  return (
    <div className="space-y-6">
      {/* Video Generation Form */}
      <GlassCard>
        <div className="flex items-center space-x-3 mb-6">
          <Video className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Generate AI Video</h3>
        </div>

        <div className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`What would you like ${userName} to say in the video? (e.g., "Hello family, I want you to know how much I love you all...")`}
            rows={4}
            maxLength={500}
            className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 resize-none"
          />
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">
              {text.length}/500 characters
            </span>
            <Button
              onClick={generateVideo}
              disabled={!text.trim() || generating}
              icon={Video}
            >
              {generating ? 'Generating Video...' : 'Generate Video'}
            </Button>
          </div>
        </div>

        {/* Current Generation Status */}
        {currentVideo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(currentVideo.status)}
                <div>
                  <p className="font-medium text-white">
                    {currentVideo.status === 'processing' && 'Generating your video...'}
                    {currentVideo.status === 'completed' && 'Video ready!'}
                    {currentVideo.status === 'failed' && 'Generation failed'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {currentVideo.status === 'processing' && 'This usually takes 2-3 minutes'}
                    {currentVideo.status === 'completed' && 'Your video is ready to view'}
                    {currentVideo.status === 'failed' && currentVideo.error}
                  </p>
                </div>
              </div>
              
              {currentVideo.status === 'completed' && currentVideo.videoUrl && (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Play}
                    onClick={() => window.open(currentVideo.videoUrl, '_blank')}
                  >
                    Play
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Download}
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = currentVideo.videoUrl!;
                      a.download = `${userName}-video-${Date.now()}.mp4`;
                      a.click();
                    }}
                  >
                    Download
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </GlassCard>

      {/* Video History */}
      <GlassCard>
        <h3 className="text-xl font-semibold text-white mb-6">Generated Videos</h3>
        
        {loadingVideos ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-8">
            <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300">No videos generated yet</p>
            <p className="text-sm text-gray-400">Generate your first AI video above</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {videos.map((video) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 rounded-lg p-4 border border-white/10"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(video.status)}
                    <span className="text-sm font-medium capitalize">{video.status}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDuration(video.created_at, video.completed_at)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                  "{video.text}"
                </p>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    {new Date(video.created_at).toLocaleDateString()}
                  </span>
                  
                  {video.status === 'completed' && video.video_url && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Play}
                        onClick={() => window.open(video.video_url, '_blank')}
                      >
                        Play
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Download}
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = video.video_url;
                          a.download = `${userName}-video-${video.id}.mp4`;
                          a.click();
                        }}
                      >
                        Download
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}