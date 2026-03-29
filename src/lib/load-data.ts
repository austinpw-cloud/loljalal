/**
 * 롤잘알 데이터 로딩 모듈
 */
import { ALL_QUESTIONS } from "@/data/questions";
import { POPULAR_CHAMPIONS } from "@/data/champions";
import type { LolQuestion, Champion } from "@/types";

export const allQuestions: LolQuestion[] = ALL_QUESTIONS;
export const allChampions: Champion[] = POPULAR_CHAMPIONS;

/** 특정 스테이지의 문제만 필터 */
export function getQuestionsByStage(stage: number): LolQuestion[] {
  return allQuestions.filter((q) => q.stage === stage);
}
