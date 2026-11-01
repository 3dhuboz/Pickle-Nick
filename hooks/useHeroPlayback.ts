import { useEffect, useState, type RefObject } from 'react';

export const useHeroPlayback = (videoRef: RefObject<HTMLVideoElement | null>): boolean => {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let disposed = false;
    let resetting = false;
    let resetTimer: number | undefined;
    const mayPlay = () => !disposed && !document.hidden && !reducedMotion.matches;
    const clearReset = () => {
      window.clearTimeout(resetTimer);
      resetTimer = undefined;
      resetting = false;
    };
    const play = () => {
      if (!mayPlay() || resetting) return;
      video.playbackRate = 1.35;
      void video.play().catch(() => {
        if (!disposed) setPlaying(false);
      });
    };
    const replay = () => {
      if (!mayPlay() || resetting) return;
      resetting = true;
      setPlaying(false);
      // Let the video fade completely to its matching poster before seeking.
      resetTimer = window.setTimeout(() => {
        clearReset();
        if (!mayPlay()) return;
        video.currentTime = 0;
        play();
      }, 450);
    };
    const handlePlaying = () => {
      if (mayPlay()) setPlaying(true);
      else video.pause();
    };
    const resume = () => {
      if (!mayPlay()) {
        clearReset();
        video.pause();
        setPlaying(false);
      } else if (video.ended) replay();
      else play();
    };
    const handleError = () => {
      clearReset();
      video.pause();
      setPlaying(false);
    };
    video.addEventListener('canplay', resume);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('ended', replay);
    video.addEventListener('error', handleError);
    reducedMotion.addEventListener('change', resume);
    document.addEventListener('visibilitychange', resume);
    resume();

    return () => {
      disposed = true;
      clearReset();
      video.removeEventListener('canplay', resume);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('ended', replay);
      video.removeEventListener('error', handleError);
      reducedMotion.removeEventListener('change', resume);
      document.removeEventListener('visibilitychange', resume);
      video.pause();
    };
  }, [videoRef]);

  return playing;
};
