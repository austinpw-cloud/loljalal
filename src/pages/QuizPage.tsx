import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuizStore } from '@/stores/quiz-store';
import { buildQuiz, STAGE_NAMES, STAGE_MULTIPLIERS } from '@/lib/quiz-engine';
import { getFeedbackMessage } from '@/lib/type-calculator';
import {
  playCorrectSound, playWrongSound, playComboSound,
  playTimerWarning, playCountdownBeep, playCountdownGo,
} from '@/lib/sounds';
import { allQuestions } from '@/lib/load-data';
import type { QuizQuestion, QuizAnswer } from '@/types';
import TopBar from '@/components/ui/TopBar';
import LoadingScreen from '@/components/ui/LoadingScreen';
import Timer from '@/components/quiz/Timer';
import ProgressBar from '@/components/quiz/ProgressBar';
import QuizCard from '@/components/quiz/QuizCard';
import AnswerOptions from '@/components/quiz/AnswerOptions';
import ComboFeedback from '@/components/quiz/ComboFeedback';

type Phase = 'countdown' | 'playing' | 'feedback' | 'transitioning';

/** 힌트 공개 수에 따른 기본 점수 — 겜잘알 동일 */
function getBasePoints(hintsRevealed: number): number {
  if (hintsRevealed <= 1) return 300;  // hint1만 (기본)
  if (hintsRevealed === 2) return 200; // hint2까지
  return 100;                          // hint3까지
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
  const [hintsRevealed, setHintsRevealed] = useState(1); // 1=hint1 always shown

  const questionStartRef = useRef(Date.now());
  const hasAnsweredRef = useRef(false);
  const navigatingRef = useRef(false);

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

  const handleAnswer = useCallback(
    (option: string) => {
      if (!currentQuestion || !session || hasAnsweredRef.current || navigatingRef.current) return;
      hasAnsweredRef.current = true;

      const timeTaken = Date.now() - questionStartRef.current;
      const isCorrect = option === currentQuestion.data.answer;
      const isLastQuestion = session.currentIndex >= session.questions.length - 1;

      // 겜잘알 포인트 계산: 힌트 기반 기본점수 + 속도 보너스
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
          setHintsUsed(0);
        }
      }, delay);
    },
    [session, currentQuestion, comboCount, hintsRevealed, soundEnabled, stage, submitAnswer, nextQuestion, onNavigate],
  );

  const handleTimerExpire = useCallback(() => {
    if (!currentQuestion || hasAnsweredRef.current) return;
    handleAnswer('__timeout__');
  }, [currentQuestion, handleAnswer]);

  // 포인트 라벨
  const pointsLabel = hintsRevealed <= 1 ? '300pt' : hintsRevealed === 2 ? '200pt' : '100pt';

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
            key={timerKey}
            duration={15}
            onExpire={handleTimerExpire}
            isPaused={phase !== 'playing'}
            onTick={(t) => {
              // 힌트2: 12초 남았을 때 공개
              if (t <= 12 && hintsRevealed < 2 && !hasAnsweredRef.current) {
                setHintsRevealed(2);
              }
              // 힌트3: 7초 남았을 때 공개
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

      {/* Answer options */}
      <div className="shrink-0 pt-1">
        <AnswerOptions
          options={currentQuestion.shuffledOptions}
          correctAnswer={currentQuestion.data.answer}
          onSelect={handleAnswer}
          selectedOption={selectedOption}
          disabled={phase !== 'playing'}
        />
      </div>

      {/* Footer */}
      <div className="shrink-0" style={{ padding: '4px 0 4px', textAlign: 'center' }}>
        <p className="text-muted" style={{ fontSize: 9, opacity: 0.6 }}>
          출제된 문제는 오류가 있을 수 있습니다
        </p>
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
