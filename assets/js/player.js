(() => {
  const STORAGE_KEY = "ddt_player_state_v1";

  const normalizeBase = (base) => {
    if (!base) return "/";
    let next = base.trim();
    if (!next.startsWith("/")) next = `/${next}`;
    if (!next.endsWith("/")) next += "/";
    return next;
  };

  const computeSiteBase = () => {
    const meta = document.querySelector('meta[name="site-base"]');
    let base = meta && meta.content ? meta.content.trim() : "";
    if (!base) {
      const parts = window.location.pathname.split("/").filter(Boolean);
      if (window.location.hostname.endsWith("github.io") && parts.length > 0) {
        base = `/${parts[0]}/`;
      } else {
        base = "/";
      }
    }
    return normalizeBase(base);
  };

  const getSiteBase = () => {
    if (window.SITE_BASE) {
      window.SITE_BASE = normalizeBase(window.SITE_BASE);
      return window.SITE_BASE;
    }
    const base = computeSiteBase();
    window.SITE_BASE = base;
    return base;
  };

  const SITE_BASE = getSiteBase();

  const rawPlaylist = [
    {
      title: "t-metal",
      src: `${SITE_BASE}assets/sounds/music/t-metal.mp3`,
      loopDefault: true
    },
    {
      title: "Add Track Title",
      src: ""
    }
  ];

  const playlist = rawPlaylist.filter((track) => track && track.src);
  if (!playlist.length) return;

  const getEl = (id) => document.getElementById(id);
  const audio = getEl("ddtAudio");
  const titleEl = getEl("ddtTrackTitle");
  const timeEl = getEl("ddtTime");
  const prevBtn = getEl("ddtPrev");
  const playBtn = getEl("ddtPlay");
  const stopBtn = getEl("ddtStop");
  const nextBtn = getEl("ddtNext");
  const loopBtn = getEl("ddtLoop");
  const hintEl = getEl("ddtHint");
  const seekInput = getEl("ddtSeek");
  const volInput = getEl("ddtVol");

  if (!audio || !titleEl || !timeEl || !prevBtn || !playBtn || !stopBtn || !nextBtn || !loopBtn || !seekInput || !volInput) {
    return;
  }

  const defaultState = {
    index: 0,
    time: 0,
    volume: 0.8,
    loop: true,
    playing: false
  };

  const loadState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...defaultState };
      const parsed = JSON.parse(raw);
      return { ...defaultState, ...parsed };
    } catch (err) {
      return { ...defaultState };
    }
  };

  let state = loadState();
  if (!Number.isFinite(state.index) || state.index < 0 || state.index >= playlist.length) {
    state.index = 0;
  }

  if (!Number.isFinite(state.volume)) {
    state.volume = defaultState.volume;
  }

  let loopEnabled = Boolean(state.loop);
  let pendingSeekTime = Number.isFinite(state.time) ? state.time : 0;
  let isSeeking = false;
  let lastSave = 0;

  const saveState = (next = {}) => {
    state = { ...state, ...next };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      // Ignore storage failures in private mode.
    }
  };

  const formatTime = (value) => {
    if (!Number.isFinite(value) || value < 0) return "0:00";
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  const updateTimeUI = () => {
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    timeEl.textContent = `${formatTime(audio.currentTime)} / ${formatTime(duration)}`;
    if (!isSeeking && duration > 0) {
      seekInput.value = String(Math.min(1000, Math.round((audio.currentTime / duration) * 1000)));
    }
  };

  const updatePlayButton = () => {
    const isPlaying = !audio.paused && !audio.ended;
    playBtn.textContent = isPlaying ? "Pause" : "Play";
    playBtn.setAttribute("aria-label", isPlaying ? "Pause" : "Play");
  };

  const updateLoopButton = () => {
    loopBtn.classList.toggle("is-active", loopEnabled);
    loopBtn.textContent = loopEnabled ? "Loop On" : "Loop Off";
    loopBtn.setAttribute("aria-pressed", String(loopEnabled));
  };

  const setHint = (message) => {
    if (!hintEl) return;
    if (message) {
      hintEl.textContent = message;
      hintEl.style.display = "block";
      return;
    }
    hintEl.textContent = "";
    hintEl.style.display = "none";
  };

  const setTrack = (index, { preserveTime = false } = {}) => {
    const safeIndex = (index + playlist.length) % playlist.length;
    const track = playlist[safeIndex];
    audio.src = track.src;
    audio.loop = loopEnabled;
    audio.load();
    titleEl.textContent = track.title;
    saveState({ index: safeIndex, time: preserveTime ? state.time : 0 });
    if (!preserveTime) {
      pendingSeekTime = 0;
      audio.currentTime = 0;
    }
    updateTimeUI();
    updatePlayButton();
  };

  const applyPendingSeek = () => {
    if (!pendingSeekTime || !Number.isFinite(audio.duration) || audio.duration === 0) return;
    const safeTime = Math.min(Math.max(pendingSeekTime, 0), Math.max(audio.duration - 0.25, 0));
    audio.currentTime = safeTime;
    pendingSeekTime = 0;
    updateTimeUI();
  };

  const attemptPlay = () => {
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => {
          setHint("");
          updatePlayButton();
        })
        .catch(() => {
          setHint("Tap Play to enable sound.");
          updatePlayButton();
        });
    } else {
      updatePlayButton();
    }
  };

  const handlePlayToggle = () => {
    if (audio.paused || audio.ended) {
      saveState({ playing: true });
      attemptPlay();
      return;
    }
    audio.pause();
    saveState({ playing: false, time: audio.currentTime });
    setHint("");
    updatePlayButton();
  };

  const handleStop = () => {
    audio.pause();
    audio.currentTime = 0;
    saveState({ playing: false, time: 0 });
    setHint("");
    updatePlayButton();
    updateTimeUI();
  };

  const handlePrev = () => {
    setTrack(state.index - 1);
    if (state.playing) {
      attemptPlay();
    }
  };

  const handleNext = () => {
    setTrack(state.index + 1);
    if (state.playing) {
      attemptPlay();
    }
  };

  const handleLoopToggle = () => {
    loopEnabled = !loopEnabled;
    audio.loop = loopEnabled;
    updateLoopButton();
    saveState({ loop: loopEnabled });
  };

  const handleSeekInput = () => {
    if (!Number.isFinite(audio.duration) || audio.duration === 0) return;
    const ratio = Number(seekInput.value) / 1000;
    audio.currentTime = audio.duration * ratio;
    updateTimeUI();
    saveState({ time: audio.currentTime });
  };

  const handleVolumeInput = () => {
    const volume = Math.min(1, Math.max(0, Number(volInput.value)));
    audio.volume = volume;
    saveState({ volume });
  };

  const handleTimeUpdate = () => {
    updateTimeUI();
    const now = Date.now();
    if (now - lastSave > 1000) {
      lastSave = now;
      saveState({ time: audio.currentTime });
    }
  };

  const handleEnded = () => {
    if (loopEnabled) return;
    setTrack(state.index + 1);
    if (state.playing) {
      attemptPlay();
    }
  };

  const handleVisibility = () => {
    if (document.visibilityState === "hidden") {
      saveState({ time: audio.currentTime });
    }
  };

  seekInput.max = "1000";

  prevBtn.addEventListener("click", handlePrev);
  playBtn.addEventListener("click", handlePlayToggle);
  stopBtn.addEventListener("click", handleStop);
  nextBtn.addEventListener("click", handleNext);
  loopBtn.addEventListener("click", handleLoopToggle);

  seekInput.addEventListener("pointerdown", () => {
    isSeeking = true;
  });
  seekInput.addEventListener("pointerup", () => {
    isSeeking = false;
  });
  seekInput.addEventListener("change", () => {
    isSeeking = false;
  });
  seekInput.addEventListener("input", handleSeekInput);

  volInput.addEventListener("input", handleVolumeInput);

  audio.addEventListener("loadedmetadata", () => {
    applyPendingSeek();
    updateTimeUI();
  });
  audio.addEventListener("timeupdate", handleTimeUpdate);
  audio.addEventListener("ended", handleEnded);

  document.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("pagehide", () => saveState({ time: audio.currentTime }));

  const init = () => {
    loopEnabled = typeof state.loop === "boolean" ? state.loop : defaultState.loop;
    if (playlist[0] && playlist[0].loopDefault) {
      loopEnabled = state.loop ?? playlist[0].loopDefault;
    }

    setTrack(state.index, { preserveTime: true });
    updateLoopButton();

    audio.volume = Math.min(1, Math.max(0, state.volume));
    volInput.value = String(audio.volume);
    pendingSeekTime = Number.isFinite(state.time) ? state.time : 0;

    updateTimeUI();
    if (state.playing) {
      attemptPlay();
    } else {
      updatePlayButton();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
