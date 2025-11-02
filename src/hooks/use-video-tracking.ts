import { useEffect, useRef } from 'react';
import { updateVideoProgress } from '@/lib/progressManager';

interface UseVideoTrackingProps {
  userId: string;
  courseId: string;
  lessonId: string;
  isPlaying: boolean;
  currentTime: number;
  enabled?: boolean;
}

/**
 * Hook to track video watch time similar to Vimeo
 * Updates progress every 10 seconds of watch time
 */
export function useVideoTracking({
  userId,
  courseId,
  lessonId,
  isPlaying,
  currentTime,
  enabled = true,
}: UseVideoTrackingProps) {
  const lastUpdateRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    // Track time when playing
    if (isPlaying) {
      const timeDiff = currentTime - lastTimeRef.current;
      
      // Only count if the time difference is reasonable (< 2 seconds)
      // This prevents counting when user seeks forward
      if (timeDiff > 0 && timeDiff < 2) {
        accumulatedTimeRef.current += timeDiff;
      }
      
      lastTimeRef.current = currentTime;

      // Update progress every 10 seconds of watched content
      if (accumulatedTimeRef.current - lastUpdateRef.current >= 10) {
        const timeToAdd = Math.floor(accumulatedTimeRef.current - lastUpdateRef.current);
        updateVideoProgress(userId, courseId, lessonId, timeToAdd, Math.floor(currentTime));
        lastUpdateRef.current = accumulatedTimeRef.current;
      }
    } else {
      lastTimeRef.current = currentTime;
    }
  }, [isPlaying, currentTime, userId, courseId, lessonId, enabled]);

  // Save any remaining time when component unmounts
  useEffect(() => {
    return () => {
      if (enabled && accumulatedTimeRef.current > lastUpdateRef.current) {
        const remainingTime = Math.floor(accumulatedTimeRef.current - lastUpdateRef.current);
        if (remainingTime > 0) {
          updateVideoProgress(userId, courseId, lessonId, remainingTime, Math.floor(lastTimeRef.current));
        }
      }
    };
  }, [userId, courseId, lessonId, enabled]);

  return {
    totalWatchedTime: Math.floor(accumulatedTimeRef.current),
    lastPosition: Math.floor(currentTime),
  };
}
