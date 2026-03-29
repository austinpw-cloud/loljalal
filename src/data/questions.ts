/**
 * 롤잘알 전체 문제 풀 통합 모듈
 * 스테이지 1-10 (아이언~챌린저)
 */
import type { LolQuestion } from "@/types";
import { QUESTIONS_STAGE_1_4 } from "./questions-1-4";
import { QUESTIONS_STAGE_5_7 } from "./questions-5-7";
import { QUESTIONS_STAGE_8_10 } from "./questions-8-10";
import { QUESTIONS_EXTRA_3_5 } from "./questions-extra-3-5";
import { QUESTIONS_EXTRA_6_8 } from "./questions-extra-6-8";
import { QUESTIONS_EXTRA_9_10 } from "./questions-extra-9-10";
import { QUESTIONS_EXTRA2_3_4 } from "./questions-extra2-3-4";
import { QUESTIONS_EXTRA2_5_7 } from "./questions-extra2-5-7";
import { QUESTIONS_EXTRA2_8_10 } from "./questions-extra2-8-10";

export const ALL_QUESTIONS: LolQuestion[] = [
  ...QUESTIONS_STAGE_1_4,
  ...QUESTIONS_STAGE_5_7,
  ...QUESTIONS_STAGE_8_10,
  ...QUESTIONS_EXTRA_3_5,
  ...QUESTIONS_EXTRA_6_8,
  ...QUESTIONS_EXTRA_9_10,
  ...QUESTIONS_EXTRA2_3_4,
  ...QUESTIONS_EXTRA2_5_7,
  ...QUESTIONS_EXTRA2_8_10,
];

/** 스테이지별 문제 수 확인 */
export function getQuestionCountByStage(): Record<number, number> {
  const counts: Record<number, number> = {};
  ALL_QUESTIONS.forEach((q) => {
    counts[q.stage] = (counts[q.stage] || 0) + 1;
  });
  return counts;
}
