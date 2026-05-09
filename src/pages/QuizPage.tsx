import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuizStore } from '@/stores/quiz-store';
import { buildQuiz, STAGE_NAMES } from '@/lib/quiz-engine';
import { getFeedbackMessage } from '@/lib/type-calculator';
import { loadRewardAd, showRewardAd } from '@/lib/toss-sdk';
import {
  playCorrectSound, playWrongSound, playComboSound,
  playTimerWarning, playCountdownBeep, playCountdownGo,
} from '@/lib/sounds';
import { allQuestions } from '@/lib/load-data';
import type { QuizQuestion, QuizAnswer } from '@/types';
import TopBar from '@/components/ui/TopBar';
import LoadingScreen from '@/components/ui/LoadingScreen';
import BannerAd from '@/components/ui/BannerAd';
import Timer, { type TimerHandle } from '@/components/quiz/Timer';
import ProgressBar from '@/components/quiz/ProgressBar';
import QuizCard from '@/components/quiz/QuizCard';
import AnswerOptions from '@/components/quiz/AnswerOptions';
import ComboFeedback from '@/components/quiz/ComboFeedback';

type Phase = 'countdown' | 'playing' | 'feedback' | 'transitioning' | 'ad';

function getBasePoints(hintsRevealed: number): number {
  if (hintsRevealed <= 1) return 300;
  if (hintsRevealed === 2) return 200;
  return 100;
}

interface QuizPageProps {
  stage: number;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function QuizPage({ stage, onNavigate }: QuizPageProps) {
  const { session, startQuiz, submitAnswer, nextQuestion, soundEnabled } = useQuizStore();

  const [phase, setPhase] = useState<Phase>('countdown');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [comboCount, setComboCount] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);
  const [feedbackPoints, setFeedbackPoints] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [countdownNum, setCountdownNum] = useState(3);
  const [explanation, setExplanation] = useState<string | undefined>();
  const [hintsRevealed, setHintsRevealed] = useState(1);

  // 부스트 상태
  const [boostUsed, setBoostUsed] = useState(false);
  const [boostLoading, setBoostLoading] = useState(false);
  const [eliminatedOption, setEliminatedOption] = useState<string | null>(null);
  const timerRef = useRef<TimerHandle>(null);

  const questionStartRef = useRef(Date.now());
  const hasAnsweredRef = useRef(false);
  const navigatingRef = useRef(false);

  // 3단계 이상에서만 부스트 표시
  const showBoost = stage >= 3;

  // 현재 문제의 오답 목록
  const wrongOptions = useMemo(() => {
    if (!session) return [];
    const q = session.questions[session.currentIndex];
    if (!q) return [];
    return q.shuffledOptions.filter((o) => o !== q.data.answer);
  }, [session, session?.currentIndex]);

  // Build quiz
  const loadedStageRef = useRef<number | null>(null);
  useEffect(() => {
    if (loadedStageRef.current === stage) return;
    loadedStageRef.current = stage;

    navigatingRef.current = false;
    setPhase('countdown');
    setCountdownNum(3);

    const questions = buildQuiz(allQuestions, stage);
    startQuiz(questions, stage);
    setComboCount(0);
    setSelectedOption(null);
    setHintsRevealed(1);
    setBoostUsed(false);
    setEliminatedOption(null);
    hasAnsweredRef.current = false;
  }, [stage, startQuiz]);

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdownNum <= 0) {
      if (soundEnabled) playCountdownGo();
      setPhase('playing');
      setTimerKey((k) => k + 1);
      questionStartRef.current = Date.now();
      return;
    }
    if (soundEnabled) playCountdownBeep();
    const timer = setTimeout(() => setCountdownNum((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdownNum, soundEnabled]);

  const currentQuestion: QuizQuestion | null =
    session?.questions[session.currentIndex] ?? null;

  // 부스트: 누르면 즉시 타이머 정지(phase='ad') → 광고 → 보상 → 타이머 재개(phase='playing')
  const handleBoost = useCallback(async () => {
    if (boostUsed || boostLoading || hasAnsweredRef.current || phase !== 'playing') return;

    // 즉시 타이머 정지
    setPhase('ad');
    setBoostLoading(true);

    const loaded = await loadRewardAd();
    if (loaded) {
      const rewarded = await showRewardAd();
      if (rewarded) {
        // 오답 1개 제거
        if (wrongOptions.length > 0) {
          const randomWrong = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
          setEliminatedOption(randomWrong);
        }
        // 시간 5초 추가
        timerRef.current?.addTime(5);
        setBoostUsed(true);
      }
    } else {
      // 광고 로드 실패 — 개발/테스트용 무료 부스트
      if (wrongOptions.length > 0) {
        const randomWrong = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
        setEliminatedOption(randomWrong);
      }
      timerRef.current?.addTime(5);
      setBoostUsed(true);
    }

    setBoostLoading(false);
    // 타이머 재개
    setPhase('playing');
  }, [boostUsed, boostLoading, phase, wrongOptions]);

  const handleAnswer = useCallback(
    (option: string) => {
      if (!currentQuestion || !session || hasAnsweredRef.current || navigatingRef.current) return;
      if (phase === 'ad') return; // 광고 중에는 답 못 누름
      hasAnsweredRef.current = true;

      const timeTaken = Date.now() - questionStartRef.current;
      const isCorrect = option === currentQuestion.data.answer;
      const isLastQuestion = session.currentIndex >= session.questions.length - 1;

      let points = 0;
      if (isCorrect) {
        const base = getBasePoints(hintsRevealed);
        const speedBonus = Math.max(0, Math.round((1 - timeTaken / 15000) * 50));
        points = base + speedBonus;
      }

      const answer: QuizAnswer = {
        questionId: currentQuestion.data.id,
        correct: isCorrect,
        timeTaken,
        selectedOption: option,
        category: currentQuestion.data.category,
        pointsEarned: points,
      };

      setSelectedOption(option);
      submitAnswer(answer);

      const newCombo = isCorrect ? comboCount + 1 : 0;
      setComboCount(newCombo);

      if (soundEnabled) {
        if (isCorrect) {
          if (newCombo >= 3) playComboSound(newCombo);
          else playCorrectSound();
        } else {
          playWrongSound();
        }
      }

      const isTimeout = option === '__timeout__';
      const msg = isTimeout ? '시간 초과!' : getFeedbackMessage(isCorrect, newCombo, stage);
      setFeedbackMsg(msg);
      setFeedbackCorrect(isCorrect);
      setFeedbackPoints(points);
      setExplanation(currentQuestion.data.explanation);
      setShowFeedback(true);
      setPhase('feedback');

      const delay = isCorrect ? 1500 : 2500;

      setTimeout(() => {
        setShowFeedback(false);
        setExplanation(undefined);

        if (isLastQuestion) {
          navigatingRef.current = true;
          setPhase('transitioning');
          onNavigate('result', { stage: String(stage) });
        } else {
          nextQuestion();
          setSelectedOption(null);
          setTimerKey((k) => k + 1);
          setPhase('playing');
          questionStartRef.current = Date.now();
          hasAnsweredRef.current = false;
          setHintsRevealed(1);
          setBoostUsed(false);
          setEliminatedOption(null);
        }
      }, delay);
    },
    [session, currentQuestion, comboCount, hintsRevealed, soundEnabled, stage, phase, submitAnswer, nextQuestion, onNavigate],
  );

  const handleTimerExpire = useCallback(() => {
    if (!currentQuestion || hasAnsweredRef.current) return;
    handleAnswer('__timeout__');
  }, [currentQuestion, handleAnswer]);

  const pointsLabel = hintsRevealed <= 1 ? '300pt' : hintsRevealed === 2 ? '200pt' : '100pt';

  // 타이머는 playing 상태에서만 동작, ad/feedback/countdown 에서는 정지
  const timerPaused = phase !== 'playing';

  if (phase === 'transitioning') {
    return (
      <div className="loading-screen">
        <div style={{ fontSize: 48 }} className="animate-pulse-neon">⚔️</div>
        <p className="text-sm text-muted">결과 계산 중...</p>
      </div>
    );
  }

  if (phase === 'countdown') {
    return (
      <main className="page-center">
        <TopBar />
        <div className="flex flex-col items-center gap-6 animate-scale-in">
          <p className="text-sm font-bold" style={{ color: 'var(--lol-blue)' }}>
            {STAGE_NAMES[stage]} · {stage}단계
          </p>
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: '50%',
              background: 'rgba(200,155,60,0.1)',
              border: '2px solid rgba(200,155,60,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span className="text-7xl font-black animate-pulse-neon-text" style={{ color: 'var(--lol-gold)' }}>
              {countdownNum}
            </span>
          </div>
          <p className="text-sm text-muted">잠시 후 퀴즈가 시작돼요</p>
        </div>
      </main>
    );
  }

  if (!session || !currentQuestion) {
    return <LoadingScreen />;
  }

  return (
    <main className="page-full" style={{ paddingTop: 48, paddingLeft: 12, paddingRight: 12 }}>
      <TopBar />

      {/* Header: stage + progress + timer */}
      <div className="shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold" style={{ color: 'var(--lol-blue)' }}>
            {STAGE_NAMES[stage]} · {stage}단계
          </span>
          <ProgressBar
            current={session.currentIndex}
            total={session.questions.length}
            answers={session.answers}
          />
        </div>
        <div className="mb-1">
          <Timer
            ref={timerRef}
            key={timerKey}
            duration={15}
            onExpire={handleTimerExpire}
            isPaused={timerPaused}
            onTick={(t) => {
              if (t <= 12 && hintsRevealed < 2 && !hasAnsweredRef.current) {
                setHintsRevealed(2);
              }
              if (t <= 7 && hintsRevealed < 3 && !hasAnsweredRef.current) {
                setHintsRevealed(3);
              }
              if (soundEnabled && t <= 3 && t > 2.9) playTimerWarning();
              if (soundEnabled && t <= 2 && t > 1.9) playTimerWarning();
              if (soundEnabled && t <= 1 && t > 0.9) playTimerWarning();
            }}
          />
        </div>
      </div>

      {/* Quiz card */}
      <div className="flex-1 min-h-0 flex items-start" key={currentQuestion.data.id}>
        <QuizCard
          question={currentQuestion}
          questionNumber={session.currentIndex + 1}
          pointsLabel={pointsLabel}
          hintsRevealed={hintsRevealed}
        />
      </div>

      {/* 부스트 버튼 (3단계 이상에서만) — 힌트와 답안 사이 가운데 */}
      {showBoost && (
        <div className="flex-1 min-h-0" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!boostUsed && (phase === 'playing' || phase === 'ad') && !selectedOption ? (
            <button
              onClick={handleBoost}
              disabled={boostLoading || phase === 'ad'}
              style={{
                width: '80%',
                padding: '12px 24px',
                border: '1px solid var(--border)',
                background: 'linear-gradient(180deg, rgba(200,155,60,0.12) 0%, rgba(10,20,40,0.8) 100%)',
                color: 'var(--lol-gold)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: 1,
                clipPath: 'polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)',
                opacity: boostLoading ? 0.5 : 1,
                transition: 'all 0.15s',
              }}
            >
              {boostLoading ? '광고 로딩 중...' : '⚡ 오답 제거 + 5초 추가'}
            </button>
          ) : boostUsed ? (
            <span className="text-xs" style={{ color: 'var(--lol-gold)', opacity: 0.4 }}>
              ⚡ 부스트 사용 완료
            </span>
          ) : null}
        </div>
      )}

      {/* Answer options */}
      <div className="shrink-0">
        <AnswerOptions
          options={currentQuestion.shuffledOptions}
          correctAnswer={currentQuestion.data.answer}
          onSelect={handleAnswer}
          selectedOption={selectedOption}
          disabled={phase !== 'playing'}
          eliminatedOption={eliminatedOption}
        />
      </div>

      {/* 띠배너 (모든 단계에서 하단 노출) */}
      <div className="shrink-0" style={{ paddingTop: 6, paddingBottom: 2 }}>
        <BannerAd />
      </div>

      <ComboFeedback
        message={feedbackMsg}
        isCorrect={feedbackCorrect}
        comboCount={comboCount}
        visible={showFeedback}
        correctAnswer={!feedbackCorrect ? currentQuestion?.data.answer : undefined}
        pointsEarned={feedbackPoints}
        explanation={explanation}
      />
    </main>
  );
}
