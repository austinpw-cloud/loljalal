import type { LolQuestion, QuizQuestion } from "@/types";

// Fisher-Yates 셔플
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 해당 스테이지의 문제 풀에서 10문제 랜덤 선택
 */
export function buildQuiz(
  allQuestions: LolQuestion[],
  stage: number,
  usedQuestionIds: Set<string> = new Set()
): QuizQuestion[] {
  // 해당 스테이지 문제 중 아직 안 쓴 것
  const available = allQuestions.filter(
    (q) => q.stage === stage && !usedQuestionIds.has(q.id)
  );

  // 풀이 부족하면 이미 쓴 것도 포함
  const pool = available.length >= 10
    ? available
    : allQuestions.filter((q) => q.stage === stage);

  const selected = shuffle(pool).slice(0, 10);

  return selected.map((q) => ({
    data: q,
    shuffledOptions: shuffle([...q.options]),
  }));
}

/**
 * 정답 포인트 계산
 * - 기본 100점
 * - 속도 보너스: 최대 +50점 (빠를수록)
 * - 스테이지 배수 적용
 */
export function calculatePoints(timeTaken: number, stage: number): number {
  const base = 100;
  const speedBonus = Math.max(0, Math.round((1 - timeTaken / 15000) * 50));
  const multiplier = STAGE_MULTIPLIERS[stage] || 1;
  return Math.round((base + speedBonus) * multiplier);
}

// ========== 스테이지 설정 ==========

export const PASS_THRESHOLD = 7;

export const STAGE_NAMES: Record<number, string> = {
  1: "아이언",
  2: "브론즈",
  3: "실버",
  4: "골드",
  5: "플래티넘",
  6: "에메랄드",
  7: "다이아몬드",
  8: "마스터",
  9: "그랜드마스터",
  10: "챌린저",
};

export const STAGE_DESCRIPTIONS: Record<number, string> = {
  1: "롤을 들어본 적 있다면 도전! 7문제 이상 맞추면 통과!",
  2: "롤 몇 판 해봤으면 거뜬한 수준.",
  3: "롤 좀 한다면 맞출 수 있는 문제들.",
  4: "아이템과 스킬을 아는 유저의 영역.",
  5: "게임 운영과 전략을 아는 유저의 영역.",
  6: "디테일한 메카닉까지 아는 유저의 영역.",
  7: "프로씬과 깊은 지식을 가진 유저의 영역.",
  8: "롤 역사와 시즌 변천사를 아는 유저의 영역.",
  9: "올드비만 아는 깊은 지식의 영역.",
  10: "롤 박사만이 도달할 수 있는 최종 관문.",
};

export const STAGE_MULTIPLIERS: Record<number, number> = {
  1: 1,
  2: 1.2,
  3: 1.5,
  4: 2,
  5: 2.5,
  6: 3,
  7: 3.5,
  8: 4,
  9: 4.5,
  10: 5,
};
