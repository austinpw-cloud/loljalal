import { useEffect, useRef, useState } from 'react';

interface TimerProps {
  duration: number;
  onExpire: () => void;
  isPaused: boolean;
  onTick?: (timeLeft: number) => void;
}

export default function Timer({ duration, onExpire, isPaused, onTick }: TimerProps) {
  const startRef = useRef(Date.now());
  const [pct, setPct] = useState(100);
  const expiredRef = useRef(false);
  const onTickRef = useRef(onTick);
  const onExpireRef = useRef(onExpire);

  // Keep refs up-to-date without restarting the timer
  onTickRef.current = onTick;
  onExpireRef.current = onExpire;

  useEffect(() => {
    startRef.current = Date.now();
    expiredRef.current = false;
    setPct(100);

    let frameId: number;
    const tick = () => {
      if (isPaused || expiredRef.current) return;
      const elapsed = (Date.now() - startRef.current) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      const newPct = (remaining / duration) * 100;
      setPct(newPct);
      onTickRef.current?.(remaining);

      if (remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current();
        return;
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [duration, isPaused]);

  const color = pct > 50 ? 'var(--neon-green)' : pct > 20 ? 'var(--neon-yellow)' : 'var(--neon-pink)';

  return (
    <div className="timer-bar">
      <div
        className="timer-fill"
        style={{
          width: `${pct}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}
