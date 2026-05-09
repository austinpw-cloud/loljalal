import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

export interface TimerHandle {
  addTime: (seconds: number) => void;
}

interface TimerProps {
  duration: number;
  onExpire: () => void;
  isPaused: boolean;
  onTick?: (timeLeft: number) => void;
}

const Timer = forwardRef<TimerHandle, TimerProps>(({ duration, onExpire, isPaused, onTick }, ref) => {
  const startRef = useRef(Date.now());
  const bonusRef = useRef(0); // 부스트로 추가된 시간
  const [pct, setPct] = useState(100);
  const expiredRef = useRef(false);
  const onTickRef = useRef(onTick);
  const onExpireRef = useRef(onExpire);

  onTickRef.current = onTick;
  onExpireRef.current = onExpire;

  useImperativeHandle(ref, () => ({
    addTime: (seconds: number) => {
      bonusRef.current += seconds;
    },
  }));

  useEffect(() => {
    startRef.current = Date.now();
    bonusRef.current = 0;
    expiredRef.current = false;
    setPct(100);

    let frameId: number;
    const tick = () => {
      if (isPaused || expiredRef.current) return;
      const elapsed = (Date.now() - startRef.current) / 1000;
      const totalDuration = duration + bonusRef.current;
      const remaining = Math.max(0, totalDuration - elapsed);
      const newPct = (remaining / totalDuration) * 100;
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

  const color = pct > 50 ? 'var(--lol-gold)' : pct > 20 ? 'var(--lol-gold-dark)' : 'var(--lol-red)';

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
});

Timer.displayName = 'Timer';
export default Timer;
