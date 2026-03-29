interface AnswerOptionsProps {
  options: string[];
  correctAnswer: string;
  onSelect: (option: string) => void;
  selectedOption: string | null;
  disabled: boolean;
}

export default function AnswerOptions({
  options,
  correctAnswer,
  onSelect,
  selectedOption,
  disabled,
}: AnswerOptionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => {
        let cls = 'answer-btn';
        if (selectedOption) {
          if (option === selectedOption && option === correctAnswer) {
            cls += ' selected-correct';
          } else if (option === selectedOption && option !== correctAnswer) {
            cls += ' selected-wrong';
          } else if (option === correctAnswer) {
            cls += ' correct-reveal';
          }
        }

        return (
          <button
            key={option}
            className={cls}
            onClick={() => onSelect(option)}
            disabled={disabled || !!selectedOption}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
