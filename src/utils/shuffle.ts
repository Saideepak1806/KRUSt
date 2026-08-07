export interface QuestionWithOptions {
  options: string[];
  correctIndex: number;
  [key: string]: any;
}

/**
 * Shuffles the `options` array of a question using Fisher-Yates shuffle
 * and updates `correctIndex` to match the correct option's new position.
 * This guarantees no fixed answer position pattern (e.g. Option A is not always correct).
 */
export function shuffleQuestionOptions<T extends QuestionWithOptions>(q: T): T {
  if (!q || !Array.isArray(q.options) || q.options.length < 2) {
    return q;
  }

  const validIndex =
    typeof q.correctIndex === 'number' &&
    q.correctIndex >= 0 &&
    q.correctIndex < q.options.length
      ? q.correctIndex
      : 0;

  const items = q.options.map((opt, idx) => ({
    text: opt,
    isCorrect: idx === validIndex,
  }));

  // Fisher-Yates Shuffle
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  const shuffledOptions = items.map((item) => item.text);
  const newCorrectIndex = items.findIndex((item) => item.isCorrect);

  return {
    ...q,
    options: shuffledOptions,
    correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0,
  };
}

/**
 * Shuffles options for an array of questions.
 */
export function shuffleAllQuestionsOptions<T extends QuestionWithOptions>(
  questions: T[]
): T[] {
  if (!Array.isArray(questions)) return [];
  return questions.map((q) => shuffleQuestionOptions(q));
}
