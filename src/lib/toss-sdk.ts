import {
  Storage,
  submitGameCenterLeaderBoardScore,
  openGameCenterLeaderboard,
  loadFullScreenAd,
  showFullScreenAd,
  share,
} from '@apps-in-toss/web-framework';

// Storage wrapper
export const TossStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await Storage.getItem(key);
    } catch {
      // Fallback to localStorage for dev
      return localStorage.getItem(key);
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      await Storage.setItem(key, value);
    } catch {
      localStorage.setItem(key, value);
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      await Storage.removeItem(key);
    } catch {
      localStorage.removeItem(key);
    }
  },
};

// Leaderboard
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
  try {
    await openGameCenterLeaderboard();
  } catch {
    console.warn('리더보드 열기 실패');
  }
}

// Integrated Ad (reward + interstitial)
const AD_GROUP_ID = 'ait-ad-test-banner-id'; // TODO: Replace with real ID

export function loadRewardAd(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (typeof loadFullScreenAd !== 'function' || !loadFullScreenAd.isSupported?.()) {
        resolve(false);
        return;
      }
      loadFullScreenAd({
        options: { adGroupId: AD_GROUP_ID },
        onEvent: (event) => {
          if (event.type === 'loaded') resolve(true);
        },
        onError: () => resolve(false),
      });
    } catch {
      resolve(false);
    }
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
        options: { adGroupId: AD_GROUP_ID },
        onEvent: (event) => {
          if (event.type === 'userEarnedReward') resolve(true);
          else if (event.type === 'dismissed') resolve(false);
        },
        onError: () => resolve(false),
      });
    } catch {
      resolve(false);
    }
  });
}

// Share
export async function shareResult(message: string): Promise<void> {
  try {
    await share({ message });
  } catch {
    // Fallback: Web Share API
    if (navigator.share) {
      await navigator.share({ text: message });
    }
  }
}
