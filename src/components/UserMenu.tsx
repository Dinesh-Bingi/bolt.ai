import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Settings, CreditCard, LogOut, ChevronDown, 
  Crown, Shield, Bell, HelpCircle 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function UserMenu() {
  const { user, profile, signOut, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
  };

  if (!user || !profile) return null;

  const getSubscriptionColor = (subscription: string) => {
    switch (subscription) {
      case 'premium': return 'text-purple-400';
      case 'lifetime': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getSubscriptionIcon = (subscription: string) => {
    switch (subscription) {
      case 'premium':
      case 'lifetime':
        return Crown;
      default:
        return Shield;
    }
  };

  const SubscriptionIcon = getSubscriptionIcon(profile.subscription || 'free');

  return (
    <div className="relative" ref={menuRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
        disabled={loading}
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
          {profile.avatar ? (
            <img 
              src={profile.avatar} 
              alt={profile.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-white" />
          )}
        </div>
        
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-white">{profile.name}</p>
          <div className="flex items-center space-x-1">
            <SubscriptionIcon className={`w-3 h-3 ${getSubscriptionColor(profile.subscription || 'free')}`} />
            <span className={`text-xs capitalize ${getSubscriptionColor(profile.subscription || 'free')}`}>
              {profile.subscription || 'free'}
            </span>
          </div>
        </div>
        
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-12 w-64 bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50"
          >
            {/* User Info Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
                  {profile.avatar ? (
                    <img 
                      src={profile.avatar} 
                      alt={profile.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{profile.name}</p>
                  <p className="text-sm text-gray-400 truncate">{user.email}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <SubscriptionIcon className={`w-3 h-3 ${getSubscriptionColor(profile.subscription || 'free')}`} />
                    <span className={`text-xs capitalize ${getSubscriptionColor(profile.subscription || 'free')}`}>
                      {profile.subscription || 'free'} plan
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <MenuItem
                icon={User}
                label="Profile Settings"
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to profile settings
                }}
              />
              
              <MenuItem
                icon={CreditCard}
                label="Subscription"
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to subscription management
                }}
              />
              
              <MenuItem
                icon={Bell}
                label="Notifications"
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to notifications
                }}
              />
              
              <MenuItem
                icon={Settings}
                label="Account Settings"
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to account settings
                }}
              />
              
              <MenuItem
                icon={HelpCircle}
                label="Help & Support"
                onClick={() => {
                  setIsOpen(false);
                  // Open help center
                }}
              />
              
              <div className="border-t border-white/10 my-2" />
              
              <MenuItem
                icon={LogOut}
                label="Sign Out"
                onClick={handleSignOut}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MenuItemProps {
  icon: React.ComponentType<any>;
  label: string;
  onClick: () => void;
  className?: string;
}

function MenuItem({ icon: Icon, label, onClick, className = '' }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-white/10 ${className}`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm">{label}</span>
    </button>
  );
}