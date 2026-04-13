(() => {
  const {
    getQuestionById,
    getCategoryById,
    getFrameSrc,
    getHintThresholds,
    toRoman,
    formatTimer
  } = window.ARGUtils;
  const state = window.ARGState;

  const elements = {};
  let currentQuestion = null;
  let activeHintLevel = null;

  function cacheElements() {
    elements.logo = document.getElementById('site-logo');
    elements.category = document.getElementById('question-category');
    elements.title = document.getElementById('question-title');
    elements.subtitle = document.getElementById('question-subtitle');
    elements.totalElapsed = document.getElementById('total-elapsed');
    elements.questionFrame = document.getElementById('question-frame');
    elements.questionIcon = document.getElementById('question-icon');
    elements.resultFrame = document.getElementById('result-frame');
    elements.resultIcon = document.getElementById('result-icon');
    elements.answerForm = document.getElementById('answer-form');
    elements.answerInput = document.getElementById('answer-input');
    elements.feedback = document.getElementById('feedback');
    elements.nextLink = document.getElementById('next-link');
    elements.lockedMessage = document.getElementById('locked-message');
    elements.hintStatus = document.getElementById('hint-status');
    elements.hintButtons = document.getElementById('hint-buttons');
    elements.hintOutput = document.getElementById('hint-output');
    elements.audioButton = document.querySelector('[data-role="audio-toggle"]');
  }

  function applyTheme(question) {
    const category = getCategoryById(question.categoryId);
    document.body.style.setProperty('--bg-image', `url('${category?.background || window.ARGData.assets.backgrounds.lobby}')`);
    document.body.style.setProperty('--accent', category?.accent || '#f1cf6b');
    document.body.style.setProperty('--accent-soft', category?.accentSoft || 'rgba(241, 207, 107, 0.24)');
    document.body.style.setProperty('--panel-tile', `url('${category?.panelTile || window.ARGData.assets.panelTiles?.stone || window.ARGData.assets.backgrounds.lobby}')`);
  }

  function updateTotalTimer() {
    elements.totalElapsed.textContent = formatTimer(state.getTotalElapsedMs());
  }

  function renderHeader(question) {
    const category = getCategoryById(question.categoryId);
    elements.logo.src = window.ARGData.branding.logo;
    elements.logo.alt = window.ARGData.branding.logoAlt || 'ARG Logo';
    elements.category.textContent = category?.title || 'CATEGORY';
    elements.title.textContent = question.title;
    elements.subtitle.textContent = `${question.description} · ${window.ARGData.ui.hintRule}`;
    elements.questionFrame.src = getFrameSrc(question.frameType, state.isQuestionSolved(question.id));
    elements.questionIcon.src = question.icon;
    elements.questionIcon.alt = `${question.title} 아이콘`;
    elements.resultFrame.src = getFrameSrc(question.frameType, state.isQuestionSolved(question.id));
    elements.resultIcon.src = question.icon;
    elements.resultIcon.alt = `${question.title} 아이콘`;
    document.title = `${question.title} · ${window.ARGData.siteTitle}`;
  }

  function setFeedback(message = '', type = 'info') {
    if (!message) {
      elements.feedback.hidden = true;
      elements.feedback.textContent = '';
      elements.feedback.className = 'feedback-board';
      return;
    }

    elements.feedback.hidden = false;
    elements.feedback.textContent = message;
    elements.feedback.className = `feedback-board ${type}`;
  }

  function renderNextLink(question) {
    const nextQuestion = state.getNextPlayableQuestion(question.id);

    if (state.getCompletionRatio() === 1) {
      elements.nextLink.hidden = false;
      elements.nextLink.href = 'index.html';
      elements.nextLink.textContent = 'RETURN TO LOBBY';
      return;
    }

    if (nextQuestion) {
      elements.nextLink.hidden = false;
      elements.nextLink.href = nextQuestion.file;
      elements.nextLink.textContent = `NEXT SLOT · ${nextQuestion.title}`;
      return;
    }

    elements.nextLink.hidden = false;
    elements.nextLink.href = 'index.html';
    elements.nextLink.textContent = 'CHECK LOBBY';
  }

  function renderSolvedState(question) {
    if (!state.isQuestionSolved(question.id)) {
      renderNextLink(question);
      elements.nextLink.hidden = true;
      return;
    }

    elements.questionFrame.src = getFrameSrc(question.frameType, true);
    elements.resultFrame.src = getFrameSrc(question.frameType, true);
    setFeedback('이미 해결한 슬롯입니다. 다시 답을 적어도 진행 상태는 유지됩니다.', 'success');
    renderNextLink(question);
  }

  function renderLockState(question) {
    const unlocked = state.isQuestionUnlocked(question.id);
    if (unlocked || state.isQuestionSolved(question.id)) {
      elements.lockedMessage.hidden = true;
      elements.answerInput.disabled = false;
      elements.answerForm.querySelector('button[type="submit"]').disabled = false;
      return;
    }

    elements.lockedMessage.hidden = false;
    elements.lockedMessage.textContent = '이 슬롯은 아직 잠겨 있습니다. 이전 슬롯을 먼저 해결한 뒤 돌아오세요.';
    elements.answerInput.disabled = true;
    elements.answerForm.querySelector('button[type="submit"]').disabled = true;
  }

  function renderHints(question) {
    const thresholds = getHintThresholds();
    const attempts = state.getAttempts(question.id);

    elements.hintStatus.textContent = `오답 ${attempts}회 · 해금 조건 ${thresholds.join(' / ')}회`;
    elements.hintButtons.innerHTML = '';

    question.hints.forEach((hint, index) => {
      const level = index + 1;
      const unlocked = state.isHintUnlocked(question.id, level);
      const viewed = state.hasViewedHint(question.id, level);

      const button = document.createElement('button');
      button.type = 'button';
      button.className = `hint-slot ${unlocked ? 'unlocked' : 'locked'} ${viewed ? 'viewed' : ''} ${activeHintLevel === level ? 'active' : ''}`;
      button.innerHTML = `
        <span class="hint-slot-top">HINT ${toRoman(level)}</span>
        <span class="hint-slot-bottom">${thresholds[index]}x</span>
      `;

      if (!unlocked) {
        button.disabled = true;
      }

      button.addEventListener('click', () => {
        if (!unlocked) return;
        state.revealHint(question.id, level);
        activeHintLevel = level;
        renderHints(question);
        window.ARGAudio?.playEffect('unlock', { volume: 0.5 });
      });

      elements.hintButtons.appendChild(button);
    });

    if (activeHintLevel && state.hasViewedHint(question.id, activeHintLevel)) {
      const hintText = question.hints[activeHintLevel - 1];
      elements.hintOutput.hidden = false;
      elements.hintOutput.innerHTML = `
        <strong>HINT ${toRoman(activeHintLevel)}</strong>
        <p>${window.ARGUtils.escapeHtml(hintText)}</p>
      `;
    } else {
      elements.hintOutput.hidden = true;
      elements.hintOutput.innerHTML = '';
    }
  }

  function maybeShowUnlockToasts(question, beforeQuestions, beforeCategories) {
    const afterQuestions = new Set(state.getUnlockedQuestionIds());
    const afterCategories = new Set(state.getUnlockedCategoryIds());

    const newlyUnlockedQuestions = [...afterQuestions].filter((id) => !beforeQuestions.has(id) && id !== question.id);
    const newlyUnlockedCategories = [...afterCategories].filter((id) => !beforeCategories.has(id));

    if (newlyUnlockedQuestions.length) {
      const unlockedQuestion = getQuestionById(newlyUnlockedQuestions[0]);
      if (unlockedQuestion) {
        window.ARGEffects.showToast({
          title: 'SLOT UNLOCKED',
          text: unlockedQuestion.title,
          icon: unlockedQuestion.icon,
          frameType: unlockedQuestion.frameType,
          playSound: false
        });
        window.ARGAudio?.playEffect('unlock', { volume: 0.7 });
      }
    }

    if (newlyUnlockedCategories.length) {
      const category = getCategoryById(newlyUnlockedCategories[0]);
      if (category) {
        window.ARGEffects.showToast({
          title: 'CATEGORY OPEN',
          text: category.title,
          icon: category.icon,
          frameType: 'challenge',
          playSound: false
        });
        window.ARGAudio?.playEffect('unlock', { volume: 0.7 });
      }
    }
  }

  function handleSubmit(question) {
    elements.answerForm.addEventListener('submit', (event) => {
      event.preventDefault();

      if (!state.isQuestionUnlocked(question.id) && !state.isQuestionSolved(question.id)) {
        setFeedback('이 슬롯은 아직 잠겨 있습니다.', 'error');
        return;
      }

      const answer = elements.answerInput.value.trim();
      if (!answer) {
        setFeedback('답안을 입력해 주세요.', 'error');
        return;
      }

      if (window.ARGUtils.matchesAnswer(answer, question.acceptedAnswers)) {
        const beforeQuestions = new Set(state.getUnlockedQuestionIds());
        const beforeCategories = new Set(state.getUnlockedCategoryIds());

        state.markSolved(question.id);
        const allClear = state.getCompletionRatio() === 1;
        const frozenTime = formatTimer(state.getTotalElapsedMs());

        elements.answerInput.value = '';
        elements.questionFrame.src = getFrameSrc(question.frameType, true);
        elements.resultFrame.src = getFrameSrc(question.frameType, true);

        setFeedback(
          allClear
            ? `모든 슬롯을 해결했습니다. 총 소요 시간 ${frozenTime}에서 타이머가 멈췄습니다.`
            : '정답입니다. 진행 상태가 저장되었고 다음 슬롯이 해금될 수 있습니다.',
          'success'
        );

        if (allClear) {
          window.ARGAudio?.playEffect('success', { volume: 0.95 });
          window.setTimeout(() => {
            window.ARGEffects.showToast({
              title: 'ALL CLEAR',
              text: `TOTAL TIME ${frozenTime}`,
              icon: window.ARGData.assets.icons.beacon,
              frameType: 'challenge',
              playSound: true
            });
          }, 120);
        } else {
          window.ARGEffects.showToast({
            title: 'CHALLENGE COMPLETE',
            text: question.title,
            icon: question.icon,
            frameType: question.frameType,
            playSound: false
          });
          window.ARGAudio?.playEffect('success', { volume: 1 });
        }

        maybeShowUnlockToasts(question, beforeQuestions, beforeCategories);
        renderNextLink(question);
        renderHints(question);
        return;
      }

      const attempts = state.recordWrongAttempt(question.id);
      setFeedback(`오답입니다. 현재 오답 ${attempts}회입니다.`, 'error');
      renderHints(question);
      window.ARGAudio?.playEffect('wrong', { volume: 1 });
    });
  }

  function mountQuestion(question) {
    currentQuestion = question;
    activeHintLevel = state.getViewedHintLevels(question.id).slice(-1)[0] || null;

    applyTheme(question);
    renderHeader(question);
    renderLockState(question);
    renderHints(question);
    renderSolvedState(question);
    updateTotalTimer();
    state.bindTimer(`question:${question.id}`);
    window.ARGAudio?.syncAudioButton();
  }

  function bindAudioButton() {
    if (!elements.audioButton) return;
    elements.audioButton.addEventListener('click', () => {
      const enabled = window.ARGAudio.toggleAudio();
      window.ARGEffects.showToast({
        title: enabled ? 'SOUND ON' : 'SOUND OFF',
        text: enabled ? '배경음과 효과음을 켰습니다.' : '배경음과 효과음을 껐습니다.',
        icon: window.ARGData.assets.icons.bell,
        frameType: enabled ? 'goal' : 'task',
        playSound: enabled
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    cacheElements();
    const questionId = window.CURRENT_QUESTION_ID;
    const question = getQuestionById(questionId);

    if (!question) {
      document.getElementById('question-root').innerHTML = `
        <section class="mc-panel error-panel">
          <p>문제 정보를 찾지 못했습니다. <a href="index.html">로비로 돌아가기</a></p>
        </section>
      `;
      return;
    }

    bindAudioButton();
    mountQuestion(question);
    handleSubmit(question);
    window.setInterval(updateTotalTimer, 1000);
  });
})();
