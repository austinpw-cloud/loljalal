import type { QuizQuestion } from '@/types';

interface QuizCardProps {
  question: QuizQuestion;
  questionNumber: number;
  pointsLabel: string;
  hintsRevealed: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: '상식',
  rule: '룰',
  champion: '챔피언',
  skill: '스킬',
  item: '아이템',
  strategy: '전략',
  pro: '프로씬',
  history: '역사',
  culture: '문화',
};

export default function QuizCard({ question, questionNumber, pointsLabel, hintsRevealed }: QuizCardProps) {
  const q = question.data;

  return (
    <div className="hint-card animate-fade-in" style={{ width: '100%' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Q{questionNumber}</span>
          <span
            className="text-xs font-bold"
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              background: 'rgba(200,155,60,0.15)',
              color: 'var(--lol-gold)',
            }}
          >
            {CATEGORY_LABELS[q.category] || q.category}
          </span>
        </div>
        <span className="points-display">{pointsLabel}</span>
      </div>

      {/* Question */}
      <p
        className="text-base font-bold text-white"
        style={{ lineHeight: 1.6, wordBreak: 'keep-all', marginBottom: 12 }}
      >
        {q.question}
      </p>

      {/* Hints — 겜잘알 동일 구조 */}
      <div className="space-y-2">
        {/* Hint 1 — 항상 보임 */}
        <div>
          <p className="hint-label">힌트 1</p>
          <p className="hint-text">{q.hint1}</p>
        </div>

        {/* Hint 2 — 12초에 공개 */}
        <div>
          <p className="hint-label">힌트 2</p>
          {hintsRevealed >= 2 ? (
            <p className="hint-text animate-fade-in">{q.hint2}</p>
          ) : (
            <p className="hint-text hint-locked">12초 후 공개</p>
          )}
        </div>

        {/* Hint 3 — 7초에 공개 */}
        <div>
          <p className="hint-label">힌트 3</p>
          {hintsRevealed >= 3 ? (
            <p className="hint-text animate-fade-in">{q.hint3}</p>
          ) : (
            <p className="hint-text hint-locked">7초 후 공개</p>
          )}
        </div>
      </div>
    </div>
  );
}
