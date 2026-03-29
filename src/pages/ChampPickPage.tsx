import { useEffect } from 'react';
import { useChampStore } from '@/stores/worldcup-store';
import { allChampions } from '@/lib/load-data';
import TopBar from '@/components/ui/TopBar';

interface ChampPickPageProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

const ROUND_LABELS: Record<number, string> = {
  16: '16강',
  8: '8강',
  4: '4강',
  2: '결승',
};

export default function ChampPickPage({ onNavigate }: ChampPickPageProps) {
  const { session, startChampPick, selectWinner, reset } = useChampStore();

  useEffect(() => {
    if (!session) {
      startChampPick(allChampions);
    }
  }, [session, startChampPick]);

  const handleGoHome = () => {
    reset();
    onNavigate('home');
  };

  if (!session) return null;

  // Champion result screen
  if (session.champion) {
    return (
      <main className="page-center">
        <TopBar />
        <div className="flex flex-col items-center gap-4 animate-scale-in" style={{ maxWidth: '20rem' }}>
          <div style={{ fontSize: 64 }}>⚔️</div>
          <h2 className="text-2xl font-black text-center" style={{ color: 'var(--lol-gold)' }}>
            나의 최애 챔프
          </h2>
          <div className="game-card w-full p-5 text-center">
            <p className="text-xl font-black text-white">{session.champion.name}</p>
            <p className="text-xs text-muted" style={{ marginTop: 4 }}>
              {session.champion.position}
            </p>
          </div>

          <div className="w-full space-y-2">
            <button
              onClick={() => {
                reset();
                startChampPick(allChampions);
              }}
              className="game-btn game-btn-primary"
              style={{ fontSize: 13 }}
            >
              다시 하기
            </button>
            <button
              onClick={handleGoHome}
              className="game-btn game-btn-secondary"
              style={{ fontSize: 13 }}
            >
              홈으로
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Current match
  const match = session.matches[session.currentMatchIndex];
  if (!match) return null;

  const roundLabel = ROUND_LABELS[session.currentRound] || `${session.currentRound}강`;
  const matchNum = session.currentMatchIndex + 1;
  const totalMatches = session.matches.length;

  return (
    <main className="page-center">
      <TopBar />
      <div className="flex flex-col items-center gap-4 w-full" style={{ maxWidth: '24rem' }}>
        {/* Round info */}
        <div className="text-center">
          <p className="text-lg font-black" style={{ color: 'var(--lol-blue)' }}>⚔️ 내 최애 챔프</p>
          <p className="text-xs text-muted" style={{ marginTop: 4 }}>
            {roundLabel} ({matchNum}/{totalMatches})
          </p>
        </div>

        {/* VS */}
        <div className="flex gap-3 w-full" style={{ alignItems: 'stretch' }}>
          <button
            className="worldcup-card animate-fade-in"
            onClick={() => selectWinner(match.champA)}
          >
            <p className="text-base font-black text-white">{match.champA.name}</p>
            <p className="text-xs text-muted">{match.champA.position}</p>
          </button>

          <div className="flex items-center">
            <span className="text-lg font-black" style={{ color: 'var(--lol-red)' }}>VS</span>
          </div>

          <button
            className="worldcup-card animate-fade-in"
            onClick={() => selectWinner(match.champB)}
          >
            <p className="text-base font-black text-white">{match.champB.name}</p>
            <p className="text-xs text-muted">{match.champB.position}</p>
          </button>
        </div>

        {/* Home button */}
        <button
          onClick={handleGoHome}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--muted)',
            fontSize: 10,
            cursor: 'pointer',
            marginTop: 8,
          }}
        >
          그만하기
        </button>
      </div>
    </main>
  );
}
