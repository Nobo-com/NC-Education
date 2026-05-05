import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  Settings, RotateCcw, RotateCw, Lock, Unlock,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomVideoPlayerProps {
  src: string;
  onEnded?: () => void;
  onError?: (e: any) => void;
  onBack?: () => void;
  courseTitle?: string;
  moduleTitle?: string;
}

export function CustomVideoPlayer({ src, onEnded, onError, onBack, courseTitle, moduleTitle }: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);

  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stateRef = useRef({ isPlaying, showSpeedMenu, isLocked });
  useEffect(() => {
    stateRef.current = { isPlaying, showSpeedMenu, isLocked };
  }, [isPlaying, showSpeedMenu, isLocked]);

  const resetControlsTimeout = React.useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      const { isPlaying: p, isLocked: l } = stateRef.current;
      if (p || l) {
        setShowControls(false);
        setShowSpeedMenu(false);
      }
    }, 5000);
  }, []);

  useEffect(() => {
    const handleActivity = () => {
      setShowControls(true);
      resetControlsTimeout();
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleActivity);
      container.addEventListener('touchstart', handleActivity);
      container.addEventListener('mouseleave', () => {
        const { isPlaying: p, isLocked: l } = stateRef.current;
        if (p || l) {
          setShowControls(false);
          setShowSpeedMenu(false);
        }
      });
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleActivity);
        container.removeEventListener('touchstart', handleActivity);
      }
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [resetControlsTimeout]);

  const togglePlay = () => {
    if (isLocked) return;
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
      resetControlsTimeout();
    }
  };

  const skip = (amount: number) => {
    if (isLocked) return;
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      if (total) {
        setProgress((current / total) * 100);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsBuffering(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;
    const seekTime = (Number(e.target.value) / 100) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setProgress(Number(e.target.value));
    }
  };

  const toggleFullScreen = async () => {
    if (isLocked) return;
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  };

   return (
    <div 
      ref={containerRef} 
      className="bg-black relative w-full h-full overflow-hidden"
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay
        className="w-full h-full object-contain"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => { setIsBuffering(false); setIsPlaying(true); }}
        onEnded={onEnded}
        onError={onError}
        playsInline
      />
      {/* UI Controls would go here similar to the other folder */}
    </div>
  );
}
