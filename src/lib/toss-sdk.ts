import {
  Storage,
  submitGameCenterLeaderBoardScore,
  openGameCenterLeaderboard,
  loadFullScreenAd,
  showFullScreenAd,
  share,
} from '@apps-in-toss/web-framework';

// ========== Storage ==========
export const TossStorage = {
  async getItem(key: string): Promise<string | null> {
    try { return await Storage.getItem(key); }
    catch { return localStorage.getItem(key); }
  },
  async setItem(key: string, value: string): Promise<void> {
    try { await Storage.setItem(key, value); }
    catch { localStorage.setItem(key, value); }
  },
  async removeItem(key: string): Promise<void> {
    try { await Storage.removeItem(key); }
    catch { localStorage.removeItem(key); }
  },
};

// ========== Leaderboard ==========
export async function submitScore(score: number): Promise<boolean> {
  try {
    const result = await submitGameCenterLeaderBoardScore({ score: String(score) });
    return result?.statusCode === 'SUCCESS';
  } catch {
    console.warn('리더보드 점수 제출 실패');
    return false;
  }
}

export async function openLeaderboard(): Promise<void> {
  try { await openGameCenterLeaderboard(); }
  catch { console.warn('리더보드 열기 실패'); }
}

// ========== 광고 ID (나중에 실제 ID로 교체) ==========
const AD_ID = {
  REWARD: 'ait-ad-test-rewarded-id',         // 리워드 (오답제거, 재도전)
  INTERSTITIAL: 'ait-ad-test-interstitial-id', // 전면 (단계 전환)
  BANNER: 'ait-ad-test-banner-id',            // 띠배너 (퀴즈 화면)
};

// ========== 리워드 광고 (오답제거, 재도전) ==========
export function loadRewardAd(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (typeof loadFullScreenAd !== 'function' || !loadFullScreenAd.isSupported?.()) {
        resolve(false);
        return;
      }
      loadFullScreenAd({
        options: { adGroupId: AD_ID.REWARD },
        onEvent: (event) => {
          if (event.type === 'loaded') resolve(true);
        },
        onError: () => resolve(false),
      });
    } catch { resolve(false); }
  });
}

export function showRewardAd(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (typeof showFullScreenAd !== 'function' || !showFullScreenAd.isSupported?.()) {
        resolve(false);
        return;
      }
      showFullScreenAd({
        options: { adGroupId: AD_ID.REWARD },
        onEvent: (event) => {
          if (event.type === 'userEarnedReward') resolve(true);
          else if (event.type === 'dismissed') resolve(false);
        },
        onError: () => resolve(false),
      });
    } catch { resolve(false); }
  });
}

// ========== 전면 광고 (단계 전환) ==========
export function loadInterstitialAd(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (typeof loadFullScreenAd !== 'function' || !loadFullScreenAd.isSupported?.()) {
        resolve(false);
        return;
      }
      loadFullScreenAd({
        options: { adGroupId: AD_ID.INTERSTITIAL },
        onEvent: (event) => {
          if (event.type === 'loaded') resolve(true);
        },
        onError: () => resolve(false),
      });
    } catch { resolve(false); }
  });
}

export function showInterstitialAd(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (typeof showFullScreenAd !== 'function' || !showFullScreenAd.isSupported?.()) {
        resolve(false);
        return;
      }
      showFullScreenAd({
        options: { adGroupId: AD_ID.INTERSTITIAL },
        onEvent: (event) => {
          if (event.type === 'dismissed') resolve(true);
        },
        onError: () => resolve(false),
      });
    } catch { resolve(false); }
  });
}

// ========== 배너 광고 ID export ==========
export const BANNER_AD_GROUP_ID = AD_ID.BANNER;

// ========== 공유 ==========
export async function shareResult(message: string): Promise<void> {
  try {
    await share({ message });
  } catch {
    if (navigator.share) {
      await navigator.share({ text: message });
    }
  }
}
