import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Phone, X } from 'lucide-react';
import Button from './ui/Button';
import VideoCall from './VideoCall';
import VoiceCall from './VoiceCall';

interface CallInterfaceProps {
  memorialName: string;
  memorialId: string;
  userId?: string;
  avatarUrl?: string;
  onSendMessage?: (message: string) => Promise<string>;
}

export default function CallInterface({ 
  memorialName, 
  memorialId, 
  userId, 
  avatarUrl,
  onSendMessage 
}: CallInterfaceProps) {
  const [callType, setCallType] = useState<'none' | 'video' | 'voice'>('none');
  const [isCallActive, setIsCallActive] = useState(false);

  const startVideoCall = () => {
    setCallType('video');
    setIsCallActive(true);
  };

  const startVoiceCall = () => {
    setCallType('voice');
    setIsCallActive(true);
  };

  const endCall = () => {
    setCallType('none');
    setIsCallActive(false);
  };

  if (isCallActive) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          {callType === 'video' ? (
            <VideoCall
              memorialName={memorialName}
              memorialId={memorialId}
              userId={userId}
              avatarUrl={avatarUrl}
              onEndCall={endCall}
              onSendMessage={onSendMessage}
            />
          ) : (
            <VoiceCall
              memorialName={memorialName}
              memorialId={memorialId}
              userId={userId}
              avatarUrl={avatarUrl}
              onEndCall={endCall}
              onSendMessage={onSendMessage}
            />
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="flex space-x-4">
      <Button
        onClick={startVideoCall}
        icon={Video}
        variant="primary"
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        Video Call
      </Button>
      <Button
        onClick={startVoiceCall}
        icon={Phone}
        variant="secondary"
        className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white border-0"
      >
        Voice Call
      </Button>
    </div>
  );
}