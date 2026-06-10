(() => {
  const STORAGE_KEY = "ddt_music_state_v1";
  const DEFAULT_VOLUME = 0.5;

  const normalizeBase = (base) => {
    if (!base) return "/";
    let next = base.trim();
    if (!next.startsWith("/")) next = `/${next}`;
    if (!next.endsWith("/")) next += "/";
    return next;
  };

  const getSiteBase = () => {
    if (window.SITE_BASE) {
      window.SITE_BASE = normalizeBase(window.SITE_BASE);
      return window.SITE_BASE;
    }
    return "/";
  };

  const loadState = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (err) {
      return {};
    }
  };

  const saveState = (next) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      // Storage can fail in strict/private contexts; music still works without persistence.
    }
  };

  const state = {
    muted: false,
    ...loadState()
  };
  let waitingForUserGesture = false;

  const audio = new Audio(`${getSiteBase()}assets/sounds/music/t-metal.mp3`);
  audio.preload = "auto";
  audio.loop = true;
  audio.volume = DEFAULT_VOLUME;
  audio.muted = Boolean(state.muted);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "music-toggle";
  toggle.setAttribute("aria-live", "polite");
  toggle.hidden = true;
  document.body.appendChild(toggle);

  const setToggleState = (mode) => {
    if (mode === "enable") {
      toggle.textContent = "Enable Music";
      toggle.setAttribute("aria-label", "Enable background music");
      toggle.hidden = false;
      return;
    }

    toggle.textContent = audio.muted ? "Unmute Music" : "Mute Music";
    toggle.setAttribute("aria-label", audio.muted ? "Unmute background music" : "Mute background music");
    toggle.hidden = false;
  };

  const playAudio = async () => {
    audio.volume = DEFAULT_VOLUME;
    try {
      if (window.__DDT_TEST_BLOCK_AUTOPLAY && !window.__ddtAllowMusicPlay) {
        throw new DOMException("Autoplay blocked in test", "NotAllowedError");
      }
      await audio.play();
      waitingForUserGesture = false;
      setToggleState("mute");
      return true;
    } catch (err) {
      waitingForUserGesture = true;
      setToggleState("enable");
      return false;
    }
  };

  toggle.addEventListener("click", async () => {
    if (audio.paused) {
      audio.muted = false;
      state.muted = false;
      saveState(state);
      await playAudio();
      return;
    }

    audio.muted = !audio.muted;
    state.muted = audio.muted;
    saveState(state);
    setToggleState("mute");
  });

  audio.addEventListener("volumechange", () => {
    if (waitingForUserGesture) return;
    state.muted = audio.muted;
    saveState(state);
    setToggleState("mute");
  });

  window.__ddtMusic = {
    audio,
    play: playAudio,
    toggle
  };

  playAudio();
})();
