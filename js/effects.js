(() => {
  let hoverTarget = null;

  function ensureToastStack() {
    let stack = document.getElementById('toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'toast-stack';
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    return stack;
  }

  function spawnPixels(x, y, color = 'var(--accent)') {
    const count = 8;
    for (let index = 0; index < count; index += 1) {
      const pixel = document.createElement('span');
      pixel.className = 'click-pixel';
      pixel.style.left = `${x}px`;
      pixel.style.top = `${y}px`;
      pixel.style.setProperty('--dx', `${(Math.random() - 0.5) * 44}px`);
      pixel.style.setProperty('--dy', `${(-18 - Math.random() * 26)}px`);
      pixel.style.setProperty('--pixel-color', color);
      document.body.appendChild(pixel);
      window.setTimeout(() => pixel.remove(), 520);
    }
  }

  function flashElement(element) {
    if (!element) return;
    element.classList.remove('flash');
    void element.offsetWidth;
    element.classList.add('flash');
  }

  function showToast({ title = 'ADVANCEMENT MADE!', text = '', icon = '', frameType = 'goal', playSound = true } = {}) {
    const stack = ensureToastStack();
    const frameSrc = window.ARGUtils.getFrameSrc(frameType, true);

    const toast = document.createElement('article');
    toast.className = 'mc-toast';
    toast.innerHTML = `
      <div class="toast-art">
        <img class="toast-frame pixel-art" src="${frameSrc}" alt="">
        ${icon ? `<img class="toast-icon pixel-art" src="${icon}" alt="">` : ''}
      </div>
      <div class="toast-copy">
        <strong>${window.ARGUtils.escapeHtml(title)}</strong>
        <span>${window.ARGUtils.escapeHtml(text)}</span>
      </div>
    `;

    stack.appendChild(toast);
    if (playSound && window.ARGAudio) {
      window.ARGAudio.playEffect('toast', { volume: 1 });
    }

    window.setTimeout(() => {
      toast.classList.add('hide');
      window.setTimeout(() => toast.remove(), 280);
    }, window.ARGData?.ui?.toastDurationMs || 4200);
  }

  function interactiveTarget(target) {
    return target.closest('button, a, .quest-slot, .category-slot, .hint-slot, .icon-button, .mc-button, [data-interactive]');
  }

  function bindGlobalEffects() {
    document.addEventListener('click', (event) => {
      const target = interactiveTarget(event.target);
      if (!target) return;
      spawnPixels(event.clientX, event.clientY, target.dataset.pixelColor || 'var(--accent)');
      window.ARGAudio?.playEffect(target.dataset.soundClick || 'click');
      flashElement(target);
    });

    document.addEventListener('mouseover', (event) => {
      const target = interactiveTarget(event.target);
      if (!target || target === hoverTarget) return;
      hoverTarget = target;
      window.ARGAudio?.maybePlayHover();
    });
  }

  document.addEventListener('DOMContentLoaded', bindGlobalEffects);

  window.ARGEffects = {
    spawnPixels,
    showToast,
    flashElement
  };
})();
