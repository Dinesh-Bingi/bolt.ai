import { useState, useEffect } from 'react';
import { memoryService } from '../api/memories';
import type { Memory } from '../types';

export function useMemories(userId: string | null) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchMemories();
    }
  }, [userId]);

  const fetchMemories = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await memoryService.getMemories(userId);
      setMemories(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveMemories = async (memoriesData: Record<string, string>) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await memoryService.saveMemories(userId, memoriesData);
      await fetchMemories(); // Refresh the list
      console.log('Memories saved successfully:', memoriesData);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to save memories:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateAIResponse = async (message: string): Promise<string> => {
    if (!userId) throw new Error('User not authenticated');
    
    try {
      return await memoryService.generateAIResponse(userId, message);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    memories,
    loading,
    error,
    saveMemories,
    generateAIResponse,
    refetch: fetchMemories,
  };
}