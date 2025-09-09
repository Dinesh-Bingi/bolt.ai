import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Heart, Flame, Flower, CreditCard, CheckCircle } from 'lucide-react';
import { realtimeService } from '../lib/realtime';

interface Notification {
  id: string;
  type: 'guestbook' | 'payment' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  icon: React.ComponentType<any>;
  color: string;
}

interface RealTimeNotificationsProps {
  userId: string;
  memorialId?: string;
}

export default function RealTimeNotifications({ userId, memorialId }: RealTimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Subscribe to user updates
    const userChannel = realtimeService.subscribeToUser(userId, (payload) => {
      handleUserUpdate(payload);
    });

    // Subscribe to memorial updates if memorialId provided
    let memorialChannel;
    if (memorialId) {
      memorialChannel = realtimeService.subscribeToMemorial(memorialId, (payload) => {
        handleMemorialUpdate(payload);
      });
    }

    // Subscribe to payment updates
    const paymentChannel = realtimeService.subscribeToPayments(userId, (payload) => {
      handlePaymentUpdate(payload);
    });

    return () => {
      realtimeService.unsubscribe(`user:${userId}`);
      if (memorialId) {
        realtimeService.unsubscribe(`memorial:${memorialId}`);
      }
      realtimeService.unsubscribe(`payments:${userId}`);
    };
  }, [userId, memorialId]);

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const handleUserUpdate = (payload: any) => {
    if (payload.eventType === 'UPDATE' && payload.new.subscription !== payload.old?.subscription) {
      addNotification({
        type: 'system',
        title: 'Subscription Updated',
        message: `Your subscription has been updated to ${payload.new.subscription}`,
        icon: CheckCircle,
        color: 'text-green-400'
      });
    }
  };

  const handleMemorialUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT' && payload.table === 'guestbook') {
      const entry = payload.new;
      let icon = Heart;
      let message = `${entry.author_name} left a message`;
      
      if (entry.type === 'candle') {
        icon = Flame;
        message = `${entry.author_name} lit a candle`;
      } else if (entry.type === 'flower') {
        icon = Flower;
        message = `${entry.author_name} left a flower`;
      }

      addNotification({
        type: 'guestbook',
        title: 'New Memorial Tribute',
        message,
        icon,
        color: 'text-purple-400'
      });
    }
  };

  const handlePaymentUpdate = (payload: any) => {
    if (payload.eventType === 'UPDATE' && payload.new.status === 'paid') {
      addNotification({
        type: 'payment',
        title: 'Payment Successful',
        message: 'Your subscription has been activated',
        icon: CreditCard,
        color: 'text-green-400'
      });
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep last 10
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notifications Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-12 w-80 bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50"
          >
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-purple-400 hover:text-purple-300"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="p-2">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                        notification.read 
                          ? 'bg-white/5 hover:bg-white/10' 
                          : 'bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30'
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <notification.icon className={`w-5 h-5 ${notification.color} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm">{notification.title}</p>
                          <p className="text-gray-300 text-xs">{notification.message}</p>
                          <p className="text-gray-500 text-xs mt-1">
                            {notification.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}