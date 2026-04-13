(() => {
  const { getAllQuestions, getCategoryById, getQuestionById, getHintThreshold } = window.ARGUtils;
  const storageKey = window.ARGData.storageKey;

  const storage = (() => {
    try {
      const testKey = '__mc_arg_storage_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    } catch (error) {
      const memory = new Map();
      return {
        getItem: (key) => (memory.has(key) ? memory.get(key) : null),
        setItem: (key, value) => memory.set(key, String(value)),
        removeItem: (key) => memory.delete(key)
      };
    }
  })();

  let state = hydrateState();
  let boundContextId = null;
  let listenersBound = false;

  function defaultQuestionState(questionId) {
    return {
      id: questionId,
      solved: false,
      solvedAt: null,
      attempts: 0,
      hintViewed: [false, false, false]
    };
  }

  function buildEmptyState() {
    const questions = {};
    for (const question of getAllQuestions()) {
      questions[question.id] = defaultQuestionState(question.id);
    }

    return {
      meta: {
        totalElapsedMs: 0,
        activeContextId: null,
        activeSince: null,
        lastUpdatedAt: Date.now(),
        audioEnabled: Boolean(window.ARGData?.audio?.defaultEnabled ?? true),
        timerStopped: false,
        completedAt: null
      },
      questions
    };
  }

  function hydrateState() {
    const empty = buildEmptyState();

    try {
      const raw = storage.getItem(storageKey);
      if (!raw) return empty;

      const parsed = JSON.parse(raw);
      empty.meta.totalElapsedMs = Number(parsed?.meta?.totalElapsedMs || 0);
      empty.meta.audioEnabled = Boolean(
        parsed?.meta?.audioEnabled ?? window.ARGData?.audio?.defaultEnabled ?? true
      );
      empty.meta.timerStopped = Boolean(parsed?.meta?.timerStopped ?? false);
      empty.meta.completedAt = parsed?.meta?.completedAt || null;

      for (const question of getAllQuestions()) {
        const saved = parsed?.questions?.[question.id] || {};
        empty.questions[question.id] = {
          ...defaultQuestionState(question.id),
          ...saved,
          attempts: Number(saved.attempts || 0),
          hintViewed: Array.isArray(saved.hintViewed)
            ? [Boolean(saved.hintViewed[0]), Boolean(saved.hintViewed[1]), Boolean(saved.hintViewed[2])]
            : [false, false, false]
        };
      }

      const allSolved = Object.values(empty.questions).every((question) => Boolean(question.solved));
      if (allSolved && !empty.meta.timerStopped) {
        empty.meta.timerStopped = true;
        empty.meta.completedAt = empty.meta.completedAt || new Date().toISOString();
      }

      return empty;
    } catch (error) {
      console.warn('상태를 불러오지 못해 새 상태를 생성합니다.', error);
      return empty;
    }
  }

  function saveState() {
    state.meta.lastUpdatedAt = Date.now();
    storage.setItem(storageKey, JSON.stringify(state));
  }

  function getState() {
    return state;
  }

  function getQuestionState(questionId) {
    if (!state.questions[questionId]) {
      state.questions[questionId] = defaultQuestionState(questionId);
      saveState();
    }
    return state.questions[questionId];
  }

  function flushActiveContext() {
    const { activeSince } = state.meta;
    if (!activeSince) return;
    state.meta.totalElapsedMs += Math.max(0, Date.now() - activeSince);
    state.meta.activeContextId = null;
    state.meta.activeSince = null;
    saveState();
  }

  function startContext(contextId) {
    if (state.meta.timerStopped) return;
    if (document.hidden) return;
    if (state.meta.activeContextId === contextId && state.meta.activeSince) return;
    flushActiveContext();
    state.meta.activeContextId = contextId;
    state.meta.activeSince = Date.now();
    saveState();
  }

  function stopContext() {
    flushActiveContext();
  }

  function bindTimer(contextId) {
    boundContextId = contextId;
    startContext(contextId);

    if (listenersBound) return;
    listenersBound = true;

    window.addEventListener('beforeunload', stopContext);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopContext();
      } else if (boundContextId) {
        startContext(boundContextId);
      }
    });
  }

  function getTotalElapsedMs() {
    if (state.meta.timerStopped) return state.meta.totalElapsedMs;
    const activeDelta = state.meta.activeSince ? Math.max(0, Date.now() - state.meta.activeSince) : 0;
    return state.meta.totalElapsedMs + activeDelta;
  }

  function recordWrongAttempt(questionId) {
    const questionState = getQuestionState(questionId);
    questionState.attempts += 1;
    saveState();
    return questionState.attempts;
  }

  function getAttempts(questionId) {
    return Number(getQuestionState(questionId).attempts || 0);
  }

  function freezeTimer() {
    if (state.meta.timerStopped) return;
    flushActiveContext();
    state.meta.timerStopped = true;
    state.meta.completedAt = state.meta.completedAt || new Date().toISOString();
    saveState();
  }

  function isTimerStopped() {
    return Boolean(state.meta.timerStopped);
  }

  function markSolved(questionId) {
    const questionState = getQuestionState(questionId);
    questionState.solved = true;
    questionState.solvedAt = questionState.solvedAt || new Date().toISOString();
    saveState();

    if (getCompletionRatio() === 1) {
      freezeTimer();
    }
  }

  function isQuestionSolved(questionId) {
    return Boolean(getQuestionState(questionId).solved);
  }

  function areQuestionPrerequisitesMet(question) {
    const prerequisites = Array.isArray(question.prerequisiteIds) ? question.prerequisiteIds : [];
    return prerequisites.every((prerequisiteId) => isQuestionSolved(prerequisiteId));
  }

  function isCategoryComplete(categoryId) {
    const category = getCategoryById(categoryId);
    if (!category) return false;
    return category.questions.every((question) => isQuestionSolved(question.id));
  }

  function isCategoryUnlocked(categoryId) {
    const category = getCategoryById(categoryId);
    if (!category) return false;
    if (!category.unlockAfterCategoryId) return true;
    return isCategoryComplete(category.unlockAfterCategoryId);
  }

  function isQuestionUnlocked(questionId) {
    const question = getQuestionById(questionId);
    if (!question) return false;
    return isCategoryUnlocked(question.categoryId) && areQuestionPrerequisitesMet(question);
  }

  function getUnlockedQuestionIds() {
    return getAllQuestions()
      .filter((question) => isQuestionUnlocked(question.id))
      .map((question) => question.id);
  }

  function getUnlockedCategoryIds() {
    return window.ARGData.categories
      .filter((category) => isCategoryUnlocked(category.id))
      .map((category) => category.id);
  }

  function getSolvedCount() {
    return getAllQuestions().filter((question) => isQuestionSolved(question.id)).length;
  }

  function getTotalQuestionCount() {
    return getAllQuestions().length;
  }

  function getCompletionRatio() {
    const total = getTotalQuestionCount();
    return total > 0 ? getSolvedCount() / total : 0;
  }

  function getCompletionPercent() {
    return Math.round(getCompletionRatio() * 100);
  }

  function isHintUnlocked(questionId, level) {
    return getAttempts(questionId) >= getHintThreshold(level);
  }

  function hasViewedHint(questionId, level) {
    return Boolean(getQuestionState(questionId).hintViewed[level - 1]);
  }

  function revealHint(questionId, level) {
    if (!isHintUnlocked(questionId, level)) return false;
    const questionState = getQuestionState(questionId);
    questionState.hintViewed[level - 1] = true;
    saveState();
    return true;
  }

  function getViewedHintLevels(questionId) {
    return getQuestionState(questionId).hintViewed
      .map((viewed, index) => (viewed ? index + 1 : null))
      .filter(Boolean);
  }

  function getNextPlayableQuestion(currentQuestionId) {
    const questions = getAllQuestions();
    const currentIndex = questions.findIndex((question) => question.id === currentQuestionId);
    if (currentIndex === -1) return null;

    for (let pointer = currentIndex + 1; pointer < questions.length; pointer += 1) {
      const candidate = questions[pointer];
      if (isQuestionUnlocked(candidate.id)) {
        return candidate;
      }
    }
    return null;
  }

  function setAudioEnabled(value) {
    state.meta.audioEnabled = Boolean(value);
    saveState();
  }

  function isAudioEnabled() {
    return Boolean(state.meta.audioEnabled);
  }

  function resetProgress() {
    stopContext();
    state = buildEmptyState();
    saveState();
  }

  window.ARGState = {
    getState,
    saveState,
    bindTimer,
    startContext,
    stopContext,
    getTotalElapsedMs,
    freezeTimer,
    isTimerStopped,
    getQuestionState,
    recordWrongAttempt,
    getAttempts,
    markSolved,
    isQuestionSolved,
    areQuestionPrerequisitesMet,
    isCategoryComplete,
    isCategoryUnlocked,
    isQuestionUnlocked,
    getUnlockedQuestionIds,
    getUnlockedCategoryIds,
    getSolvedCount,
    getTotalQuestionCount,
    getCompletionRatio,
    getCompletionPercent,
    isHintUnlocked,
    hasViewedHint,
    revealHint,
    getViewedHintLevels,
    getNextPlayableQuestion,
    setAudioEnabled,
    isAudioEnabled,
    resetProgress
  };
})();
