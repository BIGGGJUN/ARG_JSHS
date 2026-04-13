(() => {
  const { categories, branding, utilityButtons, assets, ui } = window.ARGData;
  const {
    getCategoryById,
    getQuestionById,
    getFrameSrc,
    formatTimer,
    formatFraction,
    slugToHash,
    escapeHtml
  } = window.ARGUtils;
  const state = window.ARGState;

  const elements = {};
  let activeCategoryId = null;
  let selectedQuestionId = null;
  let resetArmedUntil = 0;
  let treeOpen = false;

  const TREE_METRICS = {
    nodeWidth: 134,
    nodeHeight: 152,
    paddingX: 40,
    paddingY: 44,
    stepX: 188,
    stepY: 170
  };

  function getCategoryQuestions(categoryId) {
    return getCategoryById(categoryId)?.questions || [];
  }

  function getVisibleQuestions(categoryId) {
    return getCategoryQuestions(categoryId).filter(
      (question) => state.isQuestionUnlocked(question.id) || state.isQuestionSolved(question.id)
    );
  }

  function getInitialCategoryId() {
    const hashId = window.location.hash.replace('#', '');
    if (hashId && state.isCategoryUnlocked(hashId)) return hashId;
    const firstUnlocked = categories.find((category) => state.isCategoryUnlocked(category.id));
    return firstUnlocked?.id || categories[0]?.id || null;
  }

  function getPreferredQuestionId(categoryId) {
    const visibleQuestions = getVisibleQuestions(categoryId);

    const firstUnlockedUnsolved = visibleQuestions.find(
      (question) => state.isQuestionUnlocked(question.id) && !state.isQuestionSolved(question.id)
    );
    if (firstUnlockedUnsolved) return firstUnlockedUnsolved.id;

    return visibleQuestions[0]?.id || null;
  }

  function ensureSelectedQuestion() {
    const visibleIds = new Set(getVisibleQuestions(activeCategoryId).map((question) => question.id));
    if (!visibleIds.size) {
      selectedQuestionId = null;
      return;
    }

    if (!selectedQuestionId || !visibleIds.has(selectedQuestionId)) {
      selectedQuestionId = getPreferredQuestionId(activeCategoryId);
    }
  }

  function applyTheme(category) {
    document.body.style.setProperty('--bg-image', `url('${category?.background || assets.backgrounds.lobby}')`);
    document.body.style.setProperty('--accent', category?.accent || '#f1cf6b');
    document.body.style.setProperty('--accent-soft', category?.accentSoft || 'rgba(241, 207, 107, 0.24)');
    document.body.style.setProperty('--panel-tile', `url('${category?.panelTile || assets.panelTiles?.stone || assets.backgrounds.lobby}')`);
  }

  function renderBranding() {
    elements.logo.src = branding.logo;
    elements.logo.alt = branding.logoAlt || 'ARG Logo';
  }

  function renderCategoryButtons() {
    elements.categoryRow.innerHTML = '';

    categories.forEach((category) => {
      const unlocked = state.isCategoryUnlocked(category.id);
      const completed = state.isCategoryComplete(category.id);

      const button = document.createElement('button');
      button.type = 'button';
      button.className = `category-slot ${activeCategoryId === category.id ? 'active' : ''} ${unlocked ? '' : 'locked'} ${completed ? 'complete' : ''}`;
      button.dataset.categoryId = category.id;
      button.setAttribute('aria-pressed', activeCategoryId === category.id ? 'true' : 'false');
      button.title = unlocked ? category.title : `${category.title} · 이전 카테고리 완료 필요`;
      button.innerHTML = `
        <img class="pixel-art category-slot-icon" src="${category.icon}" alt="">
        <span class="category-slot-label">${escapeHtml(category.shortLabel)}</span>
      `;
      button.disabled = !unlocked;
      button.addEventListener('click', () => {
        activeCategoryId = category.id;
        selectedQuestionId = getPreferredQuestionId(category.id);
        treeOpen = false;
        window.history.replaceState({}, '', slugToHash(category.id));
        render();
        window.ARGAudio?.playEffect('unlock', { volume: 0.6 });
      });

      elements.categoryRow.appendChild(button);
    });
  }

  function renderUtilityButtons() {
    elements.utilityRow.innerHTML = '';

    utilityButtons.forEach((utility) => {
      let node;
      if (utility.id === 'guide') {
        node = document.createElement('a');
        node.href = utility.href;
        node.className = 'icon-button';
        node.dataset.interactive = 'true';
      } else {
        node = document.createElement('button');
        node.type = 'button';
        node.className = 'icon-button';
      }

      if (utility.id === 'audio') {
        node.dataset.role = 'audio-toggle';
        node.addEventListener('click', () => {
          const enabled = window.ARGAudio.toggleAudio();
          window.ARGEffects.showToast({
            title: enabled ? 'SOUND ON' : 'SOUND OFF',
            text: enabled ? '배경음과 효과음을 켰습니다.' : '배경음과 효과음을 껐습니다.',
            icon: utility.icon,
            frameType: enabled ? 'goal' : 'task',
            playSound: enabled
          });
        });
      }

      if (utility.id === 'reset') {
        node.addEventListener('click', () => {
          const now = Date.now();
          if (now > resetArmedUntil) {
            resetArmedUntil = now + 2500;
            window.ARGEffects.showToast({
              title: 'RESET ARMED',
              text: '2.5초 안에 다시 누르면 모든 진행 상황이 초기화됩니다.',
              icon: utility.icon,
              frameType: 'challenge',
              playSound: false
            });
            return;
          }

          resetArmedUntil = 0;
          state.resetProgress();
          activeCategoryId = getInitialCategoryId();
          selectedQuestionId = getPreferredQuestionId(activeCategoryId);
          treeOpen = false;
          render();
          window.ARGEffects.showToast({
            title: 'PROGRESS RESET',
            text: '저장된 진행 상황을 초기화했습니다.',
            icon: utility.icon,
            frameType: 'task'
          });
        });
      }

      node.innerHTML = `
        <img class="pixel-art icon-button-icon" src="${utility.icon}" alt="">
        <span class="icon-button-label" data-role="${utility.id === 'audio' ? 'audio-label' : 'icon-label'}">${escapeHtml(utility.label)}</span>
      `;
      elements.utilityRow.appendChild(node);
    });

    window.ARGAudio?.syncAudioButton();
  }

  function getTreeCounts(categoryId) {
    const total = getCategoryQuestions(categoryId).length;
    const visible = getVisibleQuestions(categoryId).length;
    const solved = getCategoryQuestions(categoryId).filter((question) => state.isQuestionSolved(question.id)).length;
    return {
      total,
      visible,
      solved,
      hidden: Math.max(0, total - visible)
    };
  }

  function renderInfoBoard() {
    const category = getCategoryById(activeCategoryId);
    if (!category) return;

    const counts = getTreeCounts(category.id);
    const totalSolved = state.getSolvedCount();
    const totalQuestions = state.getTotalQuestionCount();

    elements.boardEyebrow.textContent = `${formatFraction(counts.visible, counts.total)} DISCOVERED`;
    elements.categoryTitle.textContent = category.title;
    elements.categorySubtitle.textContent = category.subtitle;
    elements.boardIntro.textContent = treeOpen
      ? counts.hidden > 0
        ? `현재 해금된 ${counts.visible}개 슬롯만 트리에 표시되고, 남은 ${counts.hidden}개 슬롯은 숨겨져 있습니다.`
        : '현재 카테고리의 모든 슬롯이 트리에 표시됩니다.'
      : ui.lobbyIntro;
    elements.totalElapsed.textContent = formatTimer(state.getTotalElapsedMs());
    elements.globalProgress.textContent = `${state.getCompletionPercent()}%`;
    elements.globalFraction.textContent = `${formatFraction(totalSolved, totalQuestions)} CLEARED`;
  }

  function updateTreeMeta(category) {
    const counts = getTreeCounts(category.id);
    const preferred = getQuestionById(getPreferredQuestionId(category.id));
    const doorFrameType = preferred?.frameType || 'task';
    const doorSolved = preferred ? state.isQuestionSolved(preferred.id) : false;

    elements.treeToggle.textContent = treeOpen ? 'CLOSE TREE' : 'OPEN TREE';
    elements.treeToggle.setAttribute('aria-pressed', treeOpen ? 'true' : 'false');
    elements.treeDoor.setAttribute('aria-expanded', treeOpen ? 'true' : 'false');
    elements.treeStage.dataset.open = treeOpen ? 'true' : 'false';
    elements.treeMetaCopy.textContent = treeOpen
      ? counts.hidden > 0
        ? `해금된 슬롯 ${counts.visible}개를 트리로 표시 중 · 잠긴 슬롯 ${counts.hidden}개는 숨겨져 있습니다.`
        : ui.treeOpenText
      : counts.hidden > 0
        ? `닫힌 틀을 열면 현재 해금된 슬롯 ${counts.visible}개만 트리로 표시됩니다.`
        : ui.treeClosedText;

    elements.treeDoorTitle.textContent = ui.treeDoorTitle || 'SEALED FRAME';
    elements.treeDoorBody.textContent = counts.hidden > 0
      ? `${category.title} · 현재 ${counts.visible}/${counts.total} 슬롯만 해금되었습니다. 틀을 열면 숨겨지지 않은 트리만 표시됩니다.`
      : `${category.title} · 모든 슬롯이 열려 있습니다. 틀을 열어 전체 트리를 확인하세요.`;
    elements.treeDoorFrame.src = getFrameSrc(doorFrameType, doorSolved);
    elements.treeDoorIcon.src = category.icon;
    elements.treeDoorIcon.alt = `${category.title} 아이콘`;
  }

  function buildTreeLayout(questions) {
    const positions = new Map();
    let nextRootRow = 0;

    questions.forEach((question) => {
      const explicit = question.treePosition || {};
      const parentPositions = (question.prerequisiteIds || [])
        .map((id) => positions.get(id))
        .filter(Boolean);

      const hasExplicitCol = Number.isFinite(explicit.col);
      const hasExplicitRow = Number.isFinite(explicit.row);

      let col = hasExplicitCol
        ? explicit.col
        : parentPositions.length
          ? Math.max(...parentPositions.map((parent) => parent.col)) + 1
          : 0;

      let row = hasExplicitRow
        ? explicit.row
        : parentPositions.length === 1
          ? parentPositions[0].row
          : parentPositions.length > 1
            ? parentPositions.reduce((sum, parent) => sum + parent.row, 0) / parentPositions.length
            : nextRootRow++;

      if (!hasExplicitRow) {
        while ([...positions.values()].some((position) => position.col === col && Math.abs(position.row - row) < 0.22)) {
          row += 1;
        }
      }

      positions.set(question.id, {
        question,
        col,
        row
      });
    });

    const entries = [...positions.values()];
    const minRow = Math.min(...entries.map((entry) => entry.row), 0);
    if (minRow < 0) {
      entries.forEach((entry) => {
        entry.row -= minRow;
      });
    }

    entries.forEach((entry) => {
      entry.x = TREE_METRICS.paddingX + entry.col * TREE_METRICS.stepX;
      entry.y = TREE_METRICS.paddingY + entry.row * TREE_METRICS.stepY;
      entry.centerX = entry.x + TREE_METRICS.nodeWidth / 2;
      entry.centerY = entry.y + TREE_METRICS.nodeHeight / 2;
    });

    const width = Math.max(
      TREE_METRICS.nodeWidth + TREE_METRICS.paddingX * 2,
      ...entries.map((entry) => entry.x + TREE_METRICS.nodeWidth + TREE_METRICS.paddingX)
    );
    const height = Math.max(
      TREE_METRICS.nodeHeight + TREE_METRICS.paddingY * 2,
      ...entries.map((entry) => entry.y + TREE_METRICS.nodeHeight + TREE_METRICS.paddingY)
    );

    return { positions, entries, width, height };
  }

  function buildLinkPath(from, to) {
    const deltaX = to.centerX - from.centerX;
    const elbowX = from.centerX + Math.max(30, Math.min(82, deltaX / 2));
    return `M ${from.centerX} ${from.centerY} L ${elbowX} ${from.centerY} L ${elbowX} ${to.centerY} L ${to.centerX} ${to.centerY}`;
  }

  function appendLink(svg, from, to, complete) {
    const shadowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    shadowPath.setAttribute('d', buildLinkPath(from, to));
    shadowPath.setAttribute('class', 'tree-link-shadow');
    svg.appendChild(shadowPath);

    const corePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    corePath.setAttribute('d', buildLinkPath(from, to));
    corePath.setAttribute('class', `tree-link-core ${complete ? 'complete' : ''}`.trim());
    svg.appendChild(corePath);
  }

  function renderQuestionTree() {
    const category = getCategoryById(activeCategoryId);
    if (!category) return;

    const visibleQuestions = getVisibleQuestions(category.id);
    elements.questionTree.innerHTML = '';
    elements.treeLinks.innerHTML = '';

    if (!visibleQuestions.length) {
      elements.questionTree.innerHTML = `
        <div class="tree-empty">
          아직 표시할 슬롯이 없습니다.<br>
          선행 카테고리를 먼저 완료해 주세요.
        </div>
      `;
      elements.questionTree.style.width = '100%';
      elements.questionTree.style.height = '100%';
      elements.treeLinks.setAttribute('width', '0');
      elements.treeLinks.setAttribute('height', '0');
      elements.treeLinks.setAttribute('viewBox', '0 0 0 0');
      return;
    }

    const layout = buildTreeLayout(visibleQuestions);
    elements.questionTree.style.width = `${layout.width}px`;
    elements.questionTree.style.height = `${layout.height}px`;
    elements.treeLinks.setAttribute('width', String(layout.width));
    elements.treeLinks.setAttribute('height', String(layout.height));
    elements.treeLinks.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);

    visibleQuestions.forEach((question, index) => {
      const questionPosition = layout.positions.get(question.id);
      const solved = state.isQuestionSolved(question.id);

      (question.prerequisiteIds || []).forEach((prerequisiteId) => {
        const prerequisitePosition = layout.positions.get(prerequisiteId);
        if (!prerequisitePosition) return;
        appendLink(elements.treeLinks, prerequisitePosition, questionPosition, solved && state.isQuestionSolved(prerequisiteId));
      });

      const button = document.createElement('button');
      button.type = 'button';
      button.className = `tree-node ${solved ? 'complete' : 'open'} ${selectedQuestionId === question.id ? 'selected' : ''}`;
      button.dataset.questionId = question.id;
      button.dataset.nodeX = String(questionPosition.x);
      button.dataset.nodeY = String(questionPosition.y);
      button.style.left = `${questionPosition.x}px`;
      button.style.top = `${questionPosition.y}px`;
      button.setAttribute('aria-pressed', selectedQuestionId === question.id ? 'true' : 'false');
      button.innerHTML = `
        <span class="tree-node-index">${String(index + 1).padStart(2, '0')}</span>
        <div class="tree-node-art">
          <img class="pixel-art tree-node-frame" src="${getFrameSrc(question.frameType, solved)}" alt="">
          <img class="pixel-art tree-node-icon" src="${question.icon}" alt="">
        </div>
        <span class="tree-node-label">${escapeHtml(question.shortTitle || question.title)}</span>
        <span class="tree-node-state">${solved ? 'COMPLETE' : 'OPEN'}</span>
      `;
      button.addEventListener('click', () => {
        selectedQuestionId = question.id;
        renderSelectedQuestion();
      });
      elements.questionTree.appendChild(button);
    });
  }

  function getSelectedQuestionLockText(question) {
    if (!question) return '';
    if (state.isQuestionSolved(question.id)) return '이미 해결한 슬롯입니다.';
    return '현재 해금된 슬롯입니다. 바로 입장할 수 있습니다.';
  }

  function renderSelectedQuestion() {
    const category = getCategoryById(activeCategoryId);
    if (!category) return;

    if (!treeOpen) {
      const counts = getTreeCounts(category.id);
      elements.selectedFrame.src = getFrameSrc('task', false);
      elements.selectedIcon.src = category.icon;
      elements.selectedIcon.alt = `${category.title} 아이콘`;
      elements.selectedState.textContent = 'SEALED';
      elements.selectedTitle.textContent = '닫힌 틀';
      elements.selectedDescription.textContent = '닫힌 틀을 열면 현재 해금된 문제만 트리 구조로 나타나고, 선택한 슬롯 상세 정보를 볼 수 있습니다.';
      elements.selectedLock.textContent = counts.hidden > 0
        ? `현재 ${counts.visible}/${counts.total} 슬롯만 해금되었습니다.`
        : '현재 카테고리의 모든 슬롯이 열려 있습니다.';
      elements.selectedEnter.textContent = 'OPEN TREE';
      elements.selectedEnter.href = '#';
      elements.selectedEnter.classList.remove('disabled');
      elements.selectedEnter.setAttribute('aria-disabled', 'false');
      return;
    }

    const question = getQuestionById(selectedQuestionId);
    if (!question) {
      elements.selectedFrame.src = getFrameSrc('task', false);
      elements.selectedIcon.src = category.icon;
      elements.selectedState.textContent = 'EMPTY';
      elements.selectedTitle.textContent = '표시 가능한 슬롯 없음';
      elements.selectedDescription.textContent = '아직 이 카테고리에서 표시할 문제가 없습니다.';
      elements.selectedLock.textContent = '';
      elements.selectedEnter.textContent = 'LOCKED';
      elements.selectedEnter.href = '#';
      elements.selectedEnter.classList.add('disabled');
      elements.selectedEnter.setAttribute('aria-disabled', 'true');
      return;
    }

    const solved = state.isQuestionSolved(question.id);
    elements.selectedFrame.src = getFrameSrc(question.frameType, solved);
    elements.selectedIcon.src = question.icon;
    elements.selectedIcon.alt = `${question.title} 아이콘`;
    elements.selectedState.textContent = solved ? 'CLEAR' : 'OPEN';
    elements.selectedTitle.textContent = question.title;
    elements.selectedDescription.textContent = question.description;
    elements.selectedLock.textContent = getSelectedQuestionLockText(question);
    elements.selectedEnter.textContent = solved ? 'REPLAY PAGE' : 'ENTER PAGE';
    elements.selectedEnter.href = question.file;
    elements.selectedEnter.classList.remove('disabled');
    elements.selectedEnter.setAttribute('aria-disabled', 'false');

    const buttons = elements.questionTree.querySelectorAll('.tree-node');
    buttons.forEach((button) => {
      const selected = button.dataset.questionId === question.id;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
  }

  function focusSelectedNodeIntoView() {
    if (!treeOpen) return;
    const selectedNode = elements.questionTree.querySelector('.tree-node.selected');
    if (!selectedNode) return;
    selectedNode.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  function updateTimerOnly() {
    elements.totalElapsed.textContent = formatTimer(state.getTotalElapsedMs());
  }

  function render() {
    const category = getCategoryById(activeCategoryId);
    if (!category) return;

    ensureSelectedQuestion();
    applyTheme(category);
    renderBranding();
    renderCategoryButtons();
    renderUtilityButtons();
    updateTreeMeta(category);
    renderInfoBoard();
    renderQuestionTree();
    renderSelectedQuestion();

    if (treeOpen) {
      window.requestAnimationFrame(focusSelectedNodeIntoView);
    }
  }

  function openTree() {
    if (treeOpen) return;
    treeOpen = true;
    render();
    window.ARGAudio?.playEffect('unlock', { volume: 0.7 });
  }

  function closeTree() {
    if (!treeOpen) return;
    treeOpen = false;
    render();
    window.ARGAudio?.playEffect('click', { volume: 0.5 });
  }

  function cacheElements() {
    elements.logo = document.getElementById('site-logo');
    elements.categoryRow = document.getElementById('category-row');
    elements.utilityRow = document.getElementById('utility-row');
    elements.boardEyebrow = document.getElementById('board-eyebrow');
    elements.categoryTitle = document.getElementById('category-title');
    elements.categorySubtitle = document.getElementById('category-subtitle');
    elements.boardIntro = document.getElementById('board-intro');
    elements.totalElapsed = document.getElementById('total-elapsed');
    elements.globalProgress = document.getElementById('global-progress');
    elements.globalFraction = document.getElementById('global-fraction');
    elements.treeMetaCopy = document.getElementById('tree-meta-copy');
    elements.treeToggle = document.getElementById('tree-toggle');
    elements.treeStage = document.getElementById('tree-stage');
    elements.treeStageScroll = document.getElementById('tree-stage-scroll');
    elements.treeLinks = document.getElementById('tree-links');
    elements.questionTree = document.getElementById('question-tree');
    elements.treeDoor = document.getElementById('tree-door');
    elements.treeDoorFrame = document.getElementById('tree-door-frame');
    elements.treeDoorIcon = document.getElementById('tree-door-icon');
    elements.treeDoorTitle = document.getElementById('tree-door-title');
    elements.treeDoorBody = document.getElementById('tree-door-body');
    elements.selectedFrame = document.getElementById('selected-frame');
    elements.selectedIcon = document.getElementById('selected-icon');
    elements.selectedState = document.getElementById('selected-state');
    elements.selectedTitle = document.getElementById('selected-title');
    elements.selectedDescription = document.getElementById('selected-description');
    elements.selectedLock = document.getElementById('selected-lock');
    elements.selectedEnter = document.getElementById('selected-enter');
  }

  function attachEvents() {
    elements.selectedEnter.addEventListener('click', (event) => {
      if (!treeOpen) {
        event.preventDefault();
        openTree();
        return;
      }

      if (elements.selectedEnter.classList.contains('disabled')) {
        event.preventDefault();
      }
    });

    elements.treeToggle.addEventListener('click', () => {
      if (treeOpen) {
        closeTree();
      } else {
        openTree();
      }
    });

    elements.treeDoor.addEventListener('click', () => {
      openTree();
    });

    window.addEventListener('hashchange', () => {
      const categoryId = window.location.hash.replace('#', '');
      if (!categoryId || !state.isCategoryUnlocked(categoryId)) return;
      activeCategoryId = categoryId;
      selectedQuestionId = getPreferredQuestionId(categoryId);
      treeOpen = false;
      render();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    cacheElements();
    state.bindTimer('lobby');
    activeCategoryId = getInitialCategoryId();
    selectedQuestionId = getPreferredQuestionId(activeCategoryId);
    attachEvents();
    render();
    window.setInterval(updateTimerOnly, 1000);
  });
})();
