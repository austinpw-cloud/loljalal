import type { QuizAnswer, QuizResult, QuestionCategory, LoLUserType } from "@/types";

// ========== 유저 타입 판정 ==========

const CATEGORY_TO_TYPE: Record<string, LoLUserType> = {
  "rule+strategy": "라인전 장인",
  "item": "아이템 상점 단골",
  "champion+skill": "챔피언 도감 완성자",
  "pro": "LCK 해설 지망생",
  "history": "소환사 협곡 고고학자",
  "culture": "롤 밈 수집가",
};

function determineUserType(
  categoryStats: Record<QuestionCategory, { correct: number; total: number }>,
  totalScore: number,
  totalQuestions: number
): LoLUserType {
  // 전체 정답률 낮으면 신입 소환사
  if (totalScore / totalQuestions < 0.4) {
    return "신입 소환사";
  }

  // 카테고리별 정답률 계산
  const rates: Record<string, number> = {};

  // 복합 카테고리 계산
  const ruleStrategy = combineCategories(categoryStats, ["rule", "strategy"]);
  const champSkill = combineCategories(categoryStats, ["champion", "skill"]);

  rates["rule+strategy"] = ruleStrategy.total > 0 ? ruleStrategy.correct / ruleStrategy.total : 0;
  rates["item"] = categoryStats.item.total > 0 ? categoryStats.item.correct / categoryStats.item.total : 0;
  rates["champion+skill"] = champSkill.total > 0 ? champSkill.correct / champSkill.total : 0;
  rates["pro"] = categoryStats.pro.total > 0 ? categoryStats.pro.correct / categoryStats.pro.total : 0;
  rates["history"] = categoryStats.history.total > 0 ? categoryStats.history.correct / categoryStats.history.total : 0;
  rates["culture"] = categoryStats.culture.total > 0 ? categoryStats.culture.correct / categoryStats.culture.total : 0;

  // 가장 높은 정답률의 카테고리
  const sorted = Object.entries(rates).sort(([, a], [, b]) => b - a);
  const topRate = sorted[0][1];
  const bottomRate = sorted[sorted.length - 1][1];

  // 고르게 잘하면 (상위-하위 차이 15% 이내 & 전체 70%+) → 만물박사
  if (topRate - bottomRate < 0.15 && totalScore / totalQuestions >= 0.7) {
    return "롤 만물박사";
  }

  // 가장 강한 카테고리의 타입 반환
  return CATEGORY_TO_TYPE[sorted[0][0]] || "롤 만물박사";
}

function combineCategories(
  stats: Record<QuestionCategory, { correct: number; total: number }>,
  categories: QuestionCategory[]
): { correct: number; total: number } {
  return categories.reduce(
    (acc, cat) => ({
      correct: acc.correct + stats[cat].correct,
      total: acc.total + stats[cat].total,
    }),
    { correct: 0, total: 0 }
  );
}

// ========== 결과 계산 ==========

export function calculateResult(
  answers: QuizAnswer[],
  stage: number
): Omit<QuizResult, "passed"> {
  const score = answers.filter((a) => a.correct).length;

  // 총 점수 (스테이지 배수 적용 — 겜잘알 동일)
  const STAGE_MULTIPLIERS: Record<number, number> = {
    1: 1, 2: 1.2, 3: 1.5, 4: 2, 5: 2.5, 6: 3, 7: 3.5, 8: 4, 9: 4.5, 10: 5,
  };
  const multiplier = STAGE_MULTIPLIERS[stage] || 1;
  const rawPoints = answers.reduce((sum, a) => sum + a.pointsEarned, 0);
  const totalPoints = Math.round(rawPoints * multiplier);

  // 카테고리별 통계
  const allCategories: QuestionCategory[] = [
    "general", "rule", "champion", "skill", "item", "strategy", "pro", "history", "culture",
  ];
  const categoryStats = {} as Record<QuestionCategory, { correct: number; total: number }>;
  allCategories.forEach((cat) => {
    categoryStats[cat] = { correct: 0, total: 0 };
  });
  answers.forEach((a) => {
    categoryStats[a.category].total++;
    if (a.correct) categoryStats[a.category].correct++;
  });

  // 유저 타입
  const userType = determineUserType(categoryStats, score, answers.length);

  // 한 줄 평
  const tagline = generateTagline(userType, score, stage);

  return { score, totalPoints, userType, categoryStats, tagline, stage };
}

// ========== 백분위 ==========

export function calculatePercentile(score: number, allScores: number[]): number {
  if (allScores.length === 0) return 95;
  const below = allScores.filter((s) => s < score).length;
  return Math.round((below / allScores.length) * 100);
}

// ========== 한 줄 평 ==========

export function generateTagline(
  type: LoLUserType,
  score: number,
  stage: number
): string {
  // 퍼펙트
  if (score === 10) {
    const perfect: Record<number, string> = {
      1: "아이언 퍼펙트! 워밍업 끝. 다음 단계 가볼까요?",
      2: "브론즈 퍼펙트! 기본기가 탄탄하시네요.",
      3: "실버 퍼펙트! 롤 좀 하셨는데요?",
      4: "골드 퍼펙트! 아이템 빌드도 마스터급.",
      5: "플래티넘 퍼펙트! 운영의 신이시네요.",
      6: "에메랄드 퍼펙트! 디테일이 살아있습니다.",
      7: "다이아 퍼펙트?! 프로 지망생이세요?",
      8: "마스터 퍼펙트! 롤 역사의 산증인.",
      9: "그마 퍼펙트... 당신은 대체 누구십니까?",
      10: "챌린저 퍼펙트. 전설이 실존합니다. 경배.",
    };
    return perfect[stage] || perfect[1];
  }

  // 통과 (7+)
  if (score >= 7) {
    const stageNames = ["", "아이언", "브론즈", "실버", "골드", "플래티넘", "에메랄드", "다이아몬드", "마스터", "그랜드마스터", "챌린저"];
    const msgs = [
      `${stageNames[stage]} 통과! 다음 단계도 기대되는데요.`,
      `역시 롤잘알! ${stageNames[stage]}은 거뜬하시네요.`,
      `깔끔하게 통과! 다음은 더 어려워집니다.`,
    ];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }

  // 아깝게 실패 (5-6)
  if (score >= 5) {
    return "아깝다! 조금만 더 하면 통과할 수 있어요. 다시 도전!";
  }

  // 낮은 점수 (3-4)
  if (score >= 3) {
    if (stage >= 7) return "이 난이도에서 절반이면 나쁘지 않아요!";
    return "다음엔 더 잘할 수 있을 거예요. 다시 도전!";
  }

  // 매우 낮음 (0-2)
  if (stage >= 7) return "이 난이도는 원래 어려운 거예요. 기죽지 마세요!";
  return "롤을 좀 더 즐기고 오시면 더 재밌을 거예요!";
}

// ========== 유저 타입 설명 ==========

export const USER_TYPE_DESCRIPTIONS: Record<LoLUserType, string> = {
  "라인전 장인": "게임 룰과 전략에 강합니다. 운영으로 이기는 타입!",
  "아이템 상점 단골": "아이템 지식이 뛰어납니다. 빌드 하나로 게임을 바꾸는 타입!",
  "챔피언 도감 완성자": "챔피언과 스킬을 꿰뚫고 있습니다. 상대의 모든 스킬을 읽는 타입!",
  "LCK 해설 지망생": "프로씬에 밝습니다. 경기 보는 재미를 아는 타입!",
  "소환사 협곡 고고학자": "롤 역사를 꿰뚫고 있습니다. 시즌 1부터의 기억을 간직한 타입!",
  "롤 밈 수집가": "롤 문화와 밈에 강합니다. 정글차이부터 1557까지 다 아는 타입!",
  "롤 만물박사": "모든 분야를 고르게 잘 압니다. 진정한 롤잘알!",
  "신입 소환사": "아직 배울 게 많지만 괜찮아요. 롤을 더 즐기면 자연스럽게 알게 됩니다!",
};

// ========== 정답/오답 피드백 ==========

export function getFeedbackMessage(
  correct: boolean,
  comboCount: number,
  stage: number
): string {
  if (correct) {
    if (comboCount >= 10) return "10콤보!! 퍼펙트. 당신은 전설입니다.";
    if (comboCount >= 7) return `${comboCount}콤보! 혹시 프로게이머세요?`;
    if (comboCount >= 5) return `${comboCount}콤보! 롤잘알 인정!`;
    if (comboCount >= 3) return `${comboCount}콤보! 좋은 흐름이에요`;

    const msgs = stage <= 3
      ? ["이건 기본이지!", "좋아요!", "쉽죠?", "맞았습니다!"]
      : stage <= 6
      ? ["오, 아시는구나!", "인정!", "꽤 하시는데요?", "정답!"]
      : ["미쳤다 이걸 아네!", "진짜 롤잘알이시네요", "이걸 안다고?!", "존경합니다"];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }

  const wrongMsgs = stage <= 3
    ? ["아쉽네요!", "다음엔 맞춰봐요!", "이건 좀 알아야 해요"]
    : stage <= 6
    ? ["어려웠죠?", "이건 좀 까다로운 편이에요", "아깝다!"]
    : ["이건 몰라도 괜찮아요", "고인물 전용 문제예요", "어려운 게 정상이에요"];
  return wrongMsgs[Math.floor(Math.random() * wrongMsgs.length)];
}
