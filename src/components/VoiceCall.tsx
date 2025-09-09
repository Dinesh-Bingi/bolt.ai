import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, 
  User, Waves, Circle 
} from 'lucide-react';
import Button from './ui/Button';
import GlassCard from './ui/GlassCard';

interface VoiceCallProps {
  memorialName: string;
  memorialId: string;
  userId?: string;
  avatarUrl?: string;
  onEndCall: () => void;
  onSendMessage?: (message: string) => Promise<string>;
}

export default function VoiceCall({ 
  memorialName, 
  memorialId, 
  userId, 
  avatarUrl,
  onEndCall,
  onSendMessage 
}: VoiceCallProps) {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [audioLevel, setAudioLevel] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
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
      // Get user media for audio only
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize audio context for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Start audio level monitoring
      monitorAudioLevel();

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
      console.error('Failed to initialize voice call:', error);
      setConnectionStatus('disconnected');
    }
  };

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateLevel = () => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255);
        requestAnimationFrame(updateLevel);
      }
    };
    
    updateLevel();
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

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
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

  const cleanup = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
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
    <div className="relative">
      <GlassCard className="text-center p-8">
        {/* Call Header */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400' : 
              connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
            <h3 className="text-xl font-semibold text-white">{memorialName}</h3>
          </div>
          <p className="text-gray-300 capitalize">{connectionStatus}</p>
          <p className="text-sm text-gray-400 font-mono mt-2">{formatDuration(callDuration)}</p>
        </div>

        {/* Avatar with Audio Visualization */}
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto relative">
            {/* Audio Visualization Rings */}
            <AnimatePresence>
              {(isListening || isSpeaking) && (
                <>
                  {[1, 2, 3].map((ring) => (
                    <motion.div
                      key={ring}
                      initial={{ scale: 1, opacity: 0.8 }}
                      animate={{ 
                        scale: 1 + (audioLevel * ring * 0.3),
                        opacity: 0.8 - (ring * 0.2)
                      }}
                      exit={{ scale: 1, opacity: 0 }}
                      className={`absolute inset-0 rounded-full border-2 ${
                        isListening ? 'border-blue-400' : 'border-green-400'
                      }`}
                      style={{
                        transform: `scale(${1 + (ring * 0.1)})`,
                      }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>

            {/* Avatar */}
            <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt={memorialName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-white" />
              )}
            </div>

            {/* Speaking/Listening Indicator */}
            {(isListening || isSpeaking) && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center ${
                  isListening ? 'bg-blue-500' : 'bg-green-500'
                }`}
              >
                {isListening ? (
                  <Mic className="w-4 h-4 text-white" />
                ) : (
                  <Volume2 className="w-4 h-4 text-white" />
                )}
              </motion.div>
            )}
          </div>

          {/* Status Text */}
          <div className="mt-4">
            {isListening && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-blue-300 text-sm"
              >
                Listening...
              </motion.p>
            )}
            {isSpeaking && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-green-300 text-sm"
              >
                {memorialName} is speaking...
              </motion.p>
            )}
            {!isListening && !isSpeaking && (
              <p className="text-gray-400 text-sm">
                Hold the microphone button to speak
              </p>
            )}
          </div>
        </div>

        {/* Audio Level Visualization */}
        {isListening && (
          <div className="mb-6">
            <div className="flex items-center justify-center space-x-1">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    height: audioLevel > (i / 20) ? 20 + (audioLevel * 20) : 4,
                    backgroundColor: audioLevel > (i / 20) ? '#3B82F6' : '#374151'
                  }}
                  className="w-1 bg-gray-600 rounded-full"
                  style={{ height: 4 }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Call Controls */}
        <div className="flex items-center justify-center space-x-6">
          {/* Mute Toggle */}
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
            {isAudioEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </motion.button>

          {/* Push to Talk */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onMouseDown={startListening}
            onMouseUp={stopListening}
            onTouchStart={startListening}
            onTouchEnd={stopListening}
            className={`px-8 py-4 rounded-full font-semibold transition-all ${
              isListening
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Mic className="w-5 h-5" />
              <span>{isListening ? 'Listening...' : 'Hold to Speak'}</span>
            </div>
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

        {/* Instructions */}
        <div className="mt-6 text-xs text-gray-500">
          <p>Hold the microphone button and speak naturally.</p>
          <p>Release to send your message to {memorialName}.</p>
        </div>
      </GlassCard>
    </div>
  );
}