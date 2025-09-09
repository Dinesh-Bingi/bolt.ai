import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, 
  Volume2, VolumeX, Settings, Maximize2, Minimize2 
} from 'lucide-react';
import Button from './ui/Button';
import GlassCard from './ui/GlassCard';
import HolographicAvatar from './HolographicAvatar';

interface VideoCallProps {
  memorialName: string;
  memorialId: string;
  userId?: string;
  avatarUrl?: string;
  onEndCall: () => void;
  onSendMessage?: (message: string) => Promise<string>;
}

export default function VideoCall({ 
  memorialName, 
  memorialId, 
  userId, 
  avatarUrl,
  onEndCall,
  onSendMessage 
}: VideoCallProps) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const callStartTime = useRef<number>(Date.now());

  useEffect(() => {
    initializeCall();
    const timer = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
    }, 1000);

    return () => {
      clearInterval(timer);
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: isVideoEnabled, 
        audio: isAudioEnabled 
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');

          if (event.results[event.results.length - 1].isFinal) {
            handleSpeechInput(transcript);
          }
        };

        recognitionRef.current.onstart = () => setIsListening(true);
        recognitionRef.current.onend = () => setIsListening(false);
      }

      setConnectionStatus('connected');
    } catch (error) {
      console.error('Failed to initialize call:', error);
      setConnectionStatus('disconnected');
    }
  };

  const handleSpeechInput = async (transcript: string) => {
    if (!transcript.trim() || !onSendMessage) return;

    try {
      setIsSpeaking(true);
      const response = await onSendMessage(transcript);
      
      // Generate and play AI voice response
      await playAIResponse(response);
    } catch (error) {
      console.error('Failed to process speech:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const playAIResponse = async (text: string) => {
    try {
      // Call voice generation API
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          user_id: userId,
        }),
      });

      if (response.ok) {
        const { audio_url } = await response.json();
        const audio = new Audio(audio_url);
        audio.play();
      }
    } catch (error) {
      console.error('Failed to play AI response:', error);
    }
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
      }
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
      }
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const cleanup = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'relative'} bg-black rounded-2xl overflow-hidden`}>
      {/* Call Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400' : 
              connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
            <div>
              <h3 className="font-semibold">{memorialName}</h3>
              <p className="text-sm text-gray-300 capitalize">{connectionStatus}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm font-mono">{formatDuration(callDuration)}</span>
            <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-full">
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Video Area */}
      <div className="relative h-96 md:h-[500px] bg-gradient-to-br from-purple-900 to-blue-900">
        {/* AI Avatar */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ 
              scale: isSpeaking ? [1, 1.05, 1] : 1,
              opacity: isSpeaking ? [1, 0.8, 1] : 1
            }}
            transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
          >
            <HolographicAvatar
              name={memorialName}
              imageUrl={avatarUrl}
              isAnimating={isSpeaking}
            />
          </motion.div>
          
          {/* Speaking Indicator */}
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500/20 border border-green-400/50 rounded-full px-4 py-2"
            >
              <div className="flex items-center space-x-2 text-green-300">
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [4, 12, 4] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1 bg-green-400 rounded-full"
                    />
                  ))}
                </div>
                <span className="text-sm">Speaking...</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* User Video (Picture-in-Picture) */}
        {isVideoEnabled && (
          <div className="absolute top-4 right-4 w-32 h-24 bg-black rounded-lg overflow-hidden border-2 border-white/20">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <VideoOff className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
        )}

        {/* Listening Indicator */}
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bottom-4 right-4 bg-blue-500/20 border border-blue-400/50 rounded-full p-3"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Mic className="w-6 h-6 text-blue-300" />
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Call Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
        <div className="flex items-center justify-center space-x-4">
          {/* Microphone Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleAudio}
            className={`p-4 rounded-full transition-colors ${
              isAudioEnabled 
                ? 'bg-white/20 hover:bg-white/30 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </motion.button>

          {/* Push to Talk */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onMouseDown={startListening}
            onMouseUp={stopListening}
            onTouchStart={startListening}
            onTouchEnd={stopListening}
            className={`px-6 py-4 rounded-full font-semibold transition-colors ${
              isListening
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            {isListening ? 'Listening...' : 'Hold to Speak'}
          </motion.button>

          {/* Video Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-colors ${
              isVideoEnabled 
                ? 'bg-white/20 hover:bg-white/30 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </motion.button>

          {/* End Call */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onEndCall}
            className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white"
          >
            <PhoneOff className="w-6 h-6" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}