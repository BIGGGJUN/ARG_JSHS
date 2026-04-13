(() => {
  const data = () => window.ARGData;
  const hintThresholds = () => data().ui.hintUnlockAttempts || [3, 7, 12];

  function getAllQuestions() {
    return data().categories.flatMap((category, categoryIndex) =>
      category.questions.map((question, questionIndex) => ({
        ...question,
        categoryId: category.id,
        categoryIndex,
        questionIndex
      }))
    );
  }

  function getCategoryById(categoryId) {
    return data().categories.find((category) => category.id === categoryId) || null;
  }

  function getQuestionById(questionId) {
    for (const category of data().categories) {
      for (const [questionIndex, question] of category.questions.entries()) {
        if (question.id === questionId) {
          return {
            ...question,
            categoryId: category.id,
            categoryTitle: category.title,
            questionIndex
          };
        }
      }
    }
    return null;
  }

  function getQuestionOrderIndex(questionId) {
    return getAllQuestions().findIndex((question) => question.id === questionId);
  }

  function getFrameSrc(frameType = 'task', solved = false) {
    const ui = data().assets.ui;
    const map = {
      task: solved ? ui.frameTaskComplete : ui.frameTaskOpen,
      goal: solved ? ui.frameGoalComplete : ui.frameGoalOpen,
      challenge: solved ? ui.frameChallengeComplete : ui.frameChallengeOpen
    };
    return map[frameType] || map.task;
  }

  function getHintThreshold(level) {
    return hintThresholds()[Math.max(0, level - 1)] ?? 0;
  }

  function getHintThresholds() {
    return [...hintThresholds()];
  }

  function normalizeAnswer(value) {
    return String(value || '')
      .trim()
      .replace(/\s+/g, ' ')
      .toUpperCase();
  }

  function matchesAnswer(input, acceptedAnswers = []) {
    const normalizedInput = normalizeAnswer(input);
    return acceptedAnswers.some((answer) => normalizeAnswer(answer) === normalizedInput);
  }

  function formatTimer(ms) {
    const totalSeconds = Math.max(0, Math.floor(Number(ms || 0) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function formatFraction(current, total) {
    return `${current}/${total}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function toRoman(level) {
    const numerals = ['I', 'II', 'III', 'IV', 'V'];
    return numerals[level - 1] || String(level);
  }

  function slugToHash(categoryId) {
    return `#${categoryId}`;
  }

  function getFirstQuestionOfCategory(categoryId) {
    return getCategoryById(categoryId)?.questions?.[0] || null;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  window.ARGUtils = {
    getAllQuestions,
    getCategoryById,
    getQuestionById,
    getQuestionOrderIndex,
    getFrameSrc,
    getHintThreshold,
    getHintThresholds,
    normalizeAnswer,
    matchesAnswer,
    formatTimer,
    formatFraction,
    escapeHtml,
    toRoman,
    slugToHash,
    getFirstQuestionOfCategory,
    clamp
  };
})();
