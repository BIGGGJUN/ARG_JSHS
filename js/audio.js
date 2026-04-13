(() => {
  const audioConfig = window.ARGData.audio;
  const state = window.ARGState;

  let bgmAudio = null;
  let primed = false;
  let hoverStamp = 0;

  function getSoundConfig(name) {
    return audioConfig?.sounds?.[name] || null;
  }

  function getCandidates(name) {
    const sound = getSoundConfig(name);
    if (!sound) return [];
    return [sound.remote, sound.fallback].filter(Boolean);
  }

  function attachFallback(audioEl, candidates) {
    let index = 0;

    function use(indexToUse) {
      audioEl.src = candidates[indexToUse];
      audioEl.load();
    }

    if (!candidates.length) return;
    use(index);

    audioEl.addEventListener('error', () => {
      if (index + 1 >= candidates.length) return;
      index += 1;
      const shouldResume = !audioEl.paused;
      use(index);
      if (shouldResume) {
        audioEl.play().catch(() => {});
      }
    });
  }

  function playEffect(name, options = {}) {
    if (!state.isAudioEnabled()) return;
    const sound = getSoundConfig(name);
    const candidates = getCandidates(name);
    if (!sound || !candidates.length) return;

    const audioEl = new Audio();
    audioEl.preload = 'auto';
    audioEl.volume = Math.min(1, (sound.volume ?? audioConfig.effectsVolume ?? 0.4) * (options.volume ?? 1));
    attachFallback(audioEl, candidates);
    audioEl.play().catch(() => {});
  }

  function ensureBgm() {
    if (!state.isAudioEnabled()) return;
    if (bgmAudio) return;

    const sound = getSoundConfig('bgm');
    const candidates = getCandidates('bgm');
    if (!sound || !candidates.length) return;

    bgmAudio = new Audio();
    bgmAudio.loop = true;
    bgmAudio.preload = 'auto';
    bgmAudio.volume = sound.volume ?? audioConfig.bgmVolume ?? 0.16;
    attachFallback(bgmAudio, candidates);
    bgmAudio.play().catch(() => {});
  }

  function stopBgm() {
    if (!bgmAudio) return;
    bgmAudio.pause();
    bgmAudio.currentTime = 0;
    bgmAudio = null;
  }

  function syncAudioButton() {
    const buttons = document.querySelectorAll('[data-role="audio-toggle"]');
    buttons.forEach((button) => {
      const enabled = state.isAudioEnabled();
      button.dataset.enabled = enabled ? 'true' : 'false';
      button.setAttribute('aria-pressed', enabled ? 'true' : 'false');
      const label = button.querySelector('[data-role="audio-label"]');
      if (label) {
        label.textContent = enabled ? 'SOUND ON' : 'SOUND OFF';
      }
    });
  }

  function toggleAudio() {
    const nextValue = !state.isAudioEnabled();
    state.setAudioEnabled(nextValue);
    if (nextValue) {
      ensureBgm();
      playEffect('click', { volume: 0.6 });
    } else {
      stopBgm();
    }
    syncAudioButton();
    return nextValue;
  }

  function primeAudio() {
    if (primed) return;
    primed = true;
    if (state.isAudioEnabled()) {
      ensureBgm();
    }
    document.removeEventListener('pointerdown', primeAudio, true);
    document.removeEventListener('keydown', primeAudio, true);
  }

  function maybePlayHover() {
    const now = Date.now();
    if (now - hoverStamp < 70) return;
    hoverStamp = now;
    playEffect('hover');
  }

  document.addEventListener('pointerdown', primeAudio, true);
  document.addEventListener('keydown', primeAudio, true);
  document.addEventListener('DOMContentLoaded', syncAudioButton);

  window.ARGAudio = {
    playEffect,
    maybePlayHover,
    ensureBgm,
    stopBgm,
    toggleAudio,
    syncAudioButton,
    isEnabled: () => state.isAudioEnabled()
  };
})();
