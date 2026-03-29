// ========== 퀴즈 문제 카테고리 ==========
export type QuestionCategory =
  | "general"    // 일반 상식
  | "rule"       // 게임 룰/기본 메카닉
  | "champion"   // 챔피언 관련
  | "skill"      // 스킬/능력치
  | "item"       // 아이템
  | "strategy"   // 운영/전략/오브젝트
  | "pro"        // 프로씬/e스포츠
  | "history"    // 역사/올드 시즌
  | "culture";   // 밈/은어/문화

// ========== 유저 타입 (문제 카테고리 기반 판정) ==========
export type LoLUserType =
  | "라인전 장인"           // rule + strategy 강세
  | "아이템 상점 단골"      // item 강세
  | "챔피언 도감 완성자"    // champion + skill 강세
  | "LCK 해설 지망생"      // pro 강세
  | "소환사 협곡 고고학자"  // history 강세
  | "롤 밈 수집가"         // culture 강세
  | "롤 만물박사"          // 고르게 잘 맞힘
  | "신입 소환사";         // 전체적으로 낮음

// ========== 퀴즈 문제 ==========
export interface LolQuestion {
  id: string;
  stage: number;              // 1~10 (아이언~챌린저)
  category: QuestionCategory;
  question: string;
  options: string[];           // 4지선다
  answer: string;              // 정답 텍스트 (options 중 하나)
  hint1: string;               // 힌트1 — 처음부터 보임
  hint2: string;               // 힌트2 — 12초에 공개
  hint3: string;               // 힌트3 — 7초에 공개
  explanation?: string;        // 정답 후 보여줄 설명
}

// ========== 퀴즈 진행 ==========
export interface QuizQuestion {
  data: LolQuestion;
  shuffledOptions: string[];   // 런타임에 셔플된 보기
}

export interface QuizAnswer {
  questionId: string;
  correct: boolean;
  timeTaken: number;           // ms
  selectedOption: string;
  category: QuestionCategory;
  pointsEarned: number;
}

// ========== 결과 ==========
export interface QuizResult {
  score: number;               // 정답 수
  totalPoints: number;
  userType: LoLUserType;
  categoryStats: Record<QuestionCategory, { correct: number; total: number }>;
  tagline: string;
  stage: number;
  passed: boolean;
}

export interface QuizSession {
  sessionToken: string;
  stage: number;               // 1~10
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  currentIndex: number;
  result?: QuizResult;
  stageResults: StageResult[];
}

export interface StageResult {
  stage: number;
  score: number;
  totalPoints: number;
  passed: boolean;
}

// ========== 내 최애 챔프 (월드컵 대체) ==========
export interface Champion {
  id: string;
  name: string;
  position: string;
}

export interface ChampMatch {
  champA: Champion;
  champB: Champion;
}

export interface ChampSession {
  champions: Champion[];
  currentRound: number;        // 16, 8, 4, 2, 1
  matches: ChampMatch[];
  currentMatchIndex: number;
  winners: Champion[];
  champion?: Champion;
}
