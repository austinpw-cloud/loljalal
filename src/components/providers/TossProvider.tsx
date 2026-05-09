import { useEffect } from 'react';
import { pauseAudio, resumeAudio } from '@/lib/sounds';

/**
 * 앱인토스 SDK 전역 초기화 Provider
 * - Safe Area Insets (CSS env() 대신 SDK API 사용)
 * - 오디오 포커스 핸들러 (심사 필수: 백그라운드 시 사운드 종료)
 */
export default function TossProvider({ children }: { children: React.ReactNode }) {
  // Safe Area Insets — 앱인토스 WebView에서 CSS env()가 0으로 반환될 수 있으므로 SDK 사용
  useEffect(() => {
    async function initSafeArea() {
      try {
        const { SafeAreaInsets } = await import('@apps-in-toss/web-framework');

        // 초기값 설정
        const insets = SafeAreaInsets.get();
        if (insets) {
          document.documentElement.style.setProperty('--safe-top', insets.top + 'px');
          document.documentElement.style.setProperty('--safe-bottom', insets.bottom + 'px');
          document.documentElement.style.setProperty('--safe-left', (insets.left || 0) + 'px');
          document.documentElement.style.setProperty('--safe-right', (insets.right || 0) + 'px');
        }

        // 변경 구독 (회전 등)
        SafeAreaInsets.subscribe({
          onEvent: (newInsets) => {
            document.documentElement.style.setProperty('--safe-top', newInsets.top + 'px');
            document.documentElement.style.setProperty('--safe-bottom', newInsets.bottom + 'px');
            document.documentElement.style.setProperty('--safe-left', (newInsets.left || 0) + 'px');
            document.documentElement.style.setProperty('--safe-right', (newInsets.right || 0) + 'px');
          },
        });
      } catch {
        // 브라우저 환경 fallback — CSS env() 값 사용
        document.documentElement.style.setProperty('--safe-top', 'env(safe-area-inset-top, 0px)');
        document.documentElement.style.setProperty('--safe-bottom', 'env(safe-area-inset-bottom, 0px)');
      }
    }

    initSafeArea();
  }, []);

  // 오디오 포커스 (심사 필수)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        pauseAudio();
      } else {
        resumeAudio();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return <>{children}</>;
}
