import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();

  // Subscribe to memorial updates
  subscribeToMemorial(memorialId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`memorial:${memorialId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guestbook',
          filter: `memorial_id=eq.${memorialId}`
        },
        callback
      )
      .subscribe();

    this.channels.set(`memorial:${memorialId}`, channel);
    return channel;
  }

  // Subscribe to user updates
  subscribeToUser(userId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`
        },
        callback
      )
      .subscribe();

    this.channels.set(`user:${userId}`, channel);
    return channel;
  }

  // Subscribe to payment updates
  subscribeToPayments(userId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`payments:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_orders',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();

    this.channels.set(`payments:${userId}`, channel);
    return channel;
  }

  // Unsubscribe from channel
  unsubscribe(channelKey: string) {
    const channel = this.channels.get(channelKey);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelKey);
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    this.channels.forEach((channel, key) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }

  // Send real-time presence updates
  async updatePresence(channelKey: string, presence: any) {
    const channel = this.channels.get(channelKey);
    if (channel) {
      await channel.track(presence);
    }
  }
}

export const realtimeService = new RealtimeService();