import { useEffect, useRef, useState } from 'react';
import { BANNER_AD_GROUP_ID } from '@/lib/toss-sdk';

interface BannerAdProps {
  style?: React.CSSProperties;
}

export default function BannerAd({ style }: BannerAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);
  const attachedRef = useRef<{ destroy: () => void } | null>(null);

  // SDK 초기화
  useEffect(() => {
    async function init() {
      try {
        const { TossAds } = await import('@apps-in-toss/web-framework');
        if (!TossAds?.initialize?.isSupported?.()) return;

        TossAds.initialize({
          callbacks: {
            onInitialized: () => setInitialized(true),
            onInitializationFailed: () => {},
          },
        });
      } catch {
        // 브라우저 환경 — 플레이스홀더만 표시
      }
    }
    init();
  }, []);

  // 배너 부착
  useEffect(() => {
    if (!initialized || !containerRef.current) return;

    async function attach() {
      try {
        const { TossAds } = await import('@apps-in-toss/web-framework');
        attachedRef.current = TossAds.attachBanner(BANNER_AD_GROUP_ID, containerRef.current!, {
          theme: 'dark',
          tone: 'blackAndWhite',
          variant: 'expanded',
          callbacks: {
            onAdRendered: () => {},
            onNoFill: () => {},
            onAdFailedToRender: () => {},
          },
        });
      } catch {}
    }
    attach();

    return () => {
      attachedRef.current?.destroy();
      attachedRef.current = null;
    };
  }, [initialized]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: 56,
        border: '1px solid var(--border)',
        background: 'linear-gradient(180deg, rgba(200,155,60,0.05) 0%, var(--card) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        clipPath: 'polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)',
        ...style,
      }}
    >
      {/* SDK가 부착되지 않으면 플레이스홀더 */}
      {!initialized && (
        <span style={{ fontSize: 10, color: 'var(--dim)', letterSpacing: 1 }}>AD</span>
      )}
    </div>
  );
}
