import { useEffect } from 'react';
import { pauseAudio, resumeAudio } from '@/lib/sounds';

/**
 * 앱인토스 SDK 전역 초기화 Provider
 * - 오디오 포커스 핸들러 (심사 필수: 백그라운드 시 사운드 종료)
 * - visibilitychange 대응
 */
export default function TossProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 백그라운드/포그라운드 전환 시 오디오 제어 (심사 필수)
    const handleVisibility = () => {
      if (document.hidden) {
        pauseAudio();
      } else {
        resumeAudio();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return <>{children}</>;
}
