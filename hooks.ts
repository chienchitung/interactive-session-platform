
import { useState, useEffect, useRef, useCallback } from 'react';

// Custom hook for timer logic
export const useTimer = (initialSeconds = 0) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  // FIX: Replaced NodeJS.Timeout with a browser-compatible type for setInterval's return value.
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => setIsActive(true), []);
  const pause = useCallback(() => setIsActive(false), []);
  const reset = useCallback((newSeconds?: number) => {
    setSeconds(newSeconds ?? initialSeconds);
    setIsActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [initialSeconds]);


  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            if(intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  return { seconds, start, pause, reset, isActive, isFinished: seconds === 0 && !isActive };
};

// Custom hook for playing synthesized sounds
export const useAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize AudioContext on user interaction (or at least, not on module load)
    try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch(e) {
        console.error("Web Audio API is not supported in this browser.");
    }
    
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const playSound = useCallback((type: 'short-beep' | 'long-beep' | 'correct' | 'incorrect' | 'start' | 'milestone-beep') => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
        ctx.resume();
    }
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    gainNode.connect(ctx.destination);
    oscillator.connect(gainNode);

    switch (type) {
      case 'short-beep':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
        break;
      case 'long-beep':
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(440, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.7, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.8);
        break;
      case 'milestone-beep':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(660, ctx.currentTime); // E5
        gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
        break;
      case 'correct':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        oscillator.frequency.linearRampToValueAtTime(1046.50, ctx.currentTime + 0.2); // C6
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
        break;
      case 'incorrect':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(220, ctx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
        break;
      case 'start':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(261.63, ctx.currentTime); // C4
        oscillator.frequency.linearRampToValueAtTime(523.25, ctx.currentTime + 0.1); // C5
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
        break;
    }
  }, []);

  return playSound;
};
