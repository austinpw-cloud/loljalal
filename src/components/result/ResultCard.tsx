import type { QuizResult } from '@/types';
import { USER_TYPE_DESCRIPTIONS } from '@/lib/type-calculator';

const TYPE_EMOJI: Record<string, string> = {
  '라인전 장인': '🗡️',
  '아이템 상점 단골': '🛒',
  '챔피언 도감 완성자': '📖',
  'LCK 해설 지망생': '🎙️',
  '소환사 협곡 고고학자': '🏛️',
  '롤 밈 수집가': '😂',
  '롤 만물박사': '🏆',
  '신입 소환사': '🌱',
};

interface ResultCardProps {
  result: QuizResult;
}

export default function ResultCard({ result }: ResultCardProps) {
  const emoji = TYPE_EMOJI[result.userType] || '⚔️';
  const description = USER_TYPE_DESCRIPTIONS[result.userType] || '';

  return (
    <div className="result-card w-full animate-fade-in">
      {/* Type badge */}
      <div className="text-center mb-4">
        <div style={{ fontSize: 48 }}>{emoji}</div>
        <h2 className="text-xl font-black text-white" style={{ marginTop: 8 }}>
          {result.userType}
        </h2>
        <p className="text-xs text-muted" style={{ marginTop: 4 }}>
          {description}
        </p>
      </div>

      {/* Tagline */}
      <p
        className="text-sm text-center"
        style={{
          fontStyle: 'italic',
          color: 'var(--lol-gold)',
          lineHeight: 1.6,
          marginBottom: 16,
        }}
      >
        "{result.tagline}"
      </p>

      {/* Category breakdown */}
      <div className="space-y-2">
        {Object.entries(result.categoryStats)
          .filter(([, stat]) => stat.total > 0)
          .map(([cat, stat]) => {
            const rate = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
            const label = {
              general: '상식',
              rule: '룰',
              champion: '챔피언',
              skill: '스킬',
              item: '아이템',
              strategy: '전략',
              pro: '프로씬',
              history: '역사',
              culture: '문화',
            }[cat] || cat;

            return (
              <div key={cat}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-muted">{label}</span>
                  <span className="text-xs font-bold text-white">{stat.correct}/{stat.total}</span>
                </div>
                <div className="stat-bar">
                  <div
                    className="stat-fill"
                    style={{
                      width: `${rate}%`,
                      background: rate >= 80 ? 'var(--lol-gold)' : rate >= 50 ? 'var(--lol-blue)' : 'var(--lol-red)',
                    }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
