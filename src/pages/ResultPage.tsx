import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuizStore } from '@/stores/quiz-store';
import { calculateResult } from '@/lib/type-calculator';
import { STAGE_NAMES, STAGE_MULTIPLIERS, PASS_THRESHOLD } from '@/lib/quiz-engine';
import {
  submitScore, loadRewardAd, showRewardAd,
  loadInterstitialAd, showInterstitialAd,
} from '@/lib/toss-sdk';
import TopBar from '@/components/ui/TopBar';
import ResultCard from '@/components/result/ResultCard';
import RankingScreen from '@/components/result/RankingScreen';
import ShareButton from '@/components/result/ShareButton';
import CountUp from '@/components/ui/CountUp';
import type { QuizResult } from '@/types';

interface ResultPageProps {
  stage: number;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function ResultPage({ stage, onNavigate }: ResultPageProps) {
  const {
    session, setResult, addStageResult, resetQuiz, resetForNextStage,
    addPoints, totalPoints: storeTotalPoints, incrementRetry,
  } = useQuizStore();

  const [showAdGate, setShowAdGate] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [interstitialLoaded, setInterstitialLoaded] = useState(false);
  const [showRanking, setShowRanking] = useState(true);

  const checkedRef = useRef(false);
  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    if (!session || session.answers.length === 0) {
      onNavigate('home');
    }
  }, [session, onNavigate]);

  // Calculate result
  const result: QuizResult | null = useMemo(() => {
    if (!session || session.answers.length === 0) return null;
    if (session.result) return session.result;

    const calcResult = calculateResult(session.answers, stage);
    const passed = calcResult.score >= PASS_THRESHOLD;

    return { ...calcResult, passed };
  }, [session, stage]);

  // Save result & pre-load ads
  const savedRef = useRef(false);
  useEffect(() => {
    if (!result || !session || savedRef.current) return;
    savedRef.current = true;

    setResult(result);
    addStageResult({ stage, score: result.score, totalPoints: result.totalPoints, passed: result.passed });
    addPoints(result.totalPoints);
    submitScore(storeTotalPoints + result.totalPoints);

    // 미통과 → 리워드 광고 미리 로드
    if (!result.passed) {
      loadRewardAd().then(setAdLoaded);
    }
    // 통과 → 전면 광고 미리 로드 (다음 단계 진입용)
    if (result.passed && stage < 10) {
      loadInterstitialAd().then(setInterstitialLoaded);
    }
  }, [result, session, stage, setResult, addStageResult, addPoints, storeTotalPoints]);

  // 재도전 (리워드 광고)
  const handleRetrySameStage = () => {
    setShowAdGate(true);
  };

  const handleAdComplete = async () => {
    if (adLoaded) {
      await showRewardAd();
    }
    setShowAdGate(false);
    incrementRetry(stage);
    onNavigate('quiz', { stage: String(stage) });
  };

  // 다음 단계 (전면 광고)
  const handleNextStage = async () => {
    const nextStage = Math.min(10, stage + 1);

    // 전면 광고 표시
    if (interstitialLoaded) {
      await showInterstitialAd();
    }

    resetForNextStage();
    onNavigate('quiz', { stage: String(nextStage) });
  };

  const handleGoHome = () => {
    resetQuiz();
    onNavigate('home');
  };

  if (!result) {
    return (
      <div className="loading-screen">
        <p className="text-sm text-muted">결과 계산 중...</p>
      </div>
    );
  }

  if (showRanking) {
    return (
      <>
        <TopBar />
        <RankingScreen onNext={() => setShowRanking(false)} />
      </>
    );
  }

  if (showAdGate) {
    return (
      <main className="page-center">
        <TopBar />
        <div className="game-card p-5 text-center animate-scale-in" style={{ maxWidth: '20rem' }}>
          <p className="text-sm font-bold text-white mb-1">한 판 더 하고 싶으세요?</p>
          <p className="text-xs text-muted mb-4">광고를 보면 바로 도전할 수 있어요</p>
          <button onClick={handleAdComplete} className="game-btn game-btn-primary">
            {adLoaded ? '광고 보고 재도전' : '바로 재도전'}
          </button>
          <button
            onClick={() => setShowAdGate(false)}
            className="text-xs text-muted"
            style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            취소
          </button>
        </div>
      </main>
    );
  }

  const passed = result.passed;
  const isLastStage = stage >= 10;
  const multiplier = STAGE_MULTIPLIERS[stage] || 1;

  return (
    <main className="page-full" style={{ paddingTop: 56, paddingBottom: 12, paddingLeft: 12, paddingRight: 12 }}>
      <TopBar />

      {/* Pass/fail banner */}
      <div className={`shrink-0 mb-2 ${passed ? 'banner-pass' : 'banner-fail'}`}>
        <p className={`text-xs font-bold ${passed ? 'text-neon-green' : 'text-neon-pink'}`}>
          {passed
            ? `${STAGE_NAMES[stage]} 통과! ⚔️ (${result.score}/10)`
            : `${result.score}/10 — ${PASS_THRESHOLD}개 이상 맞춰야 통과!`}
        </p>
      </div>

      {/* Points display */}
      <div className="shrink-0 mb-2 game-card p-3 text-center">
        <p className="text-xs text-muted mb-1">
          이번 단계 {multiplier > 1 && <span className="text-neon-yellow">(x{multiplier})</span>}
        </p>
        <p className="text-2xl font-black text-neon-yellow mb-2">
          +<CountUp end={result.totalPoints} duration={800} suffix="pt" />
        </p>
        <div style={{ height: 1, background: 'var(--border)', marginBottom: 8 }} />
        <p className="text-xs text-muted mb-1">누적 총점</p>
        <p className="text-3xl font-black text-white">
          <CountUp end={storeTotalPoints} duration={2000} suffix="pt" />
        </p>
      </div>

      {/* Result card */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ResultCard result={result} />
      </div>

      {/* Action buttons */}
      <div className="shrink-0 pt-2 space-y-2" style={{ maxWidth: '24rem', margin: '0 auto', width: '100%' }}>
        <ShareButton result={result} onShareComplete={() => addPoints(15)} />

        {!passed && (
          <button onClick={handleRetrySameStage} className="game-btn game-btn-primary" style={{ fontSize: 13 }}>
            짧은 광고 보고 재도전하기
          </button>
        )}

        {passed && !isLastStage && (
          <button onClick={handleNextStage} className="game-btn game-btn-primary" style={{ fontSize: 13 }}>
            {stage + 1}단계 도전 → {STAGE_NAMES[stage + 1]} ⚔️
          </button>
        )}

        {passed && isLastStage && (
          <button
            onClick={() => onNavigate('final')}
            className="game-btn game-btn-primary"
            style={{ fontSize: 13 }}
          >
            전체 총점 확인하기 🏆
          </button>
        )}

        <button
          onClick={handleGoHome}
          style={{
            width: '100%',
            padding: '4px 0',
            textAlign: 'center',
            fontSize: 10,
            color: 'var(--muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          처음으로
        </button>
      </div>
    </main>
  );
}
