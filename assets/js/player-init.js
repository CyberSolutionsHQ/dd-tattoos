(() => {
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

  const ensureStyles = () => {
    let link = document.querySelector("link[data-ddt-player]");
    if (link) return link;
    link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `${getSiteBase()}assets/css/player.css`;
    link.dataset.ddtPlayer = "true";
    link.addEventListener("error", () => {
      console.error("[ddt-player] Failed to load player.css:", link.href);
    });
    document.head.appendChild(link);
    return link;
  };

  const ensureScript = () => {
    if (document.querySelector("script[data-ddt-player]")) return;
    const script = document.createElement("script");
    script.src = `${getSiteBase()}assets/js/player.js`;
    script.defer = true;
    script.dataset.ddtPlayer = "true";
    script.addEventListener("error", () => {
      console.error("[ddt-player] Failed to load player.js:", script.src);
    });
    document.body.appendChild(script);
  };

  const buildPlayerMarkup = () => {
    const player = document.createElement("div");
    player.id = "ddt-player";
    player.className = "ddt-player";
    player.setAttribute("role", "region");
    player.setAttribute("aria-label", "Site audio player");
    player.innerHTML = `
      <audio id="ddtAudio" preload="metadata"></audio>
      <div class="ddt-player__row ddt-player__meta">
        <div id="ddtTrackTitle" class="ddt-player__title">t-metal</div>
        <div id="ddtTime" class="ddt-player__time">0:00 / 0:00</div>
      </div>
      <div class="ddt-player__row ddt-player__controls">
        <div class="ddt-player__buttons">
          <button id="ddtPrev" type="button" aria-label="Previous track">Back</button>
          <button id="ddtPlay" type="button" aria-label="Play">Play</button>
          <button id="ddtStop" type="button" aria-label="Stop">Stop</button>
          <button id="ddtNext" type="button" aria-label="Next track">Skip</button>
          <button id="ddtLoop" type="button" aria-pressed="true" aria-label="Toggle loop">Loop On</button>
        </div>
        <label class="ddt-player__range ddt-player__range--seek">
          <span class="sr-only">Seek</span>
          <input id="ddtSeek" type="range" min="0" max="1000" value="0" aria-label="Seek" />
        </label>
        <label class="ddt-player__range ddt-player__range--vol">
          <span class="sr-only">Volume</span>
          <input id="ddtVol" type="range" min="0" max="1" step="0.01" value="0.8" aria-label="Volume" />
        </label>
      </div>
      <div id="ddtHint" class="ddt-player__hint" aria-live="polite"></div>
    `;
    return player;
  };

  const setBodyPadding = (player) => {
    const height = player.offsetHeight || 110;
    document.documentElement.style.setProperty("--ddt-player-height", `${height}px`);
    const siblings = Array.from(document.body.children).filter((el) => el !== player);
    const lastContent = siblings[siblings.length - 1];
    if (!lastContent) return;
    const rect = lastContent.getBoundingClientRect();
    const overlap = rect.bottom > window.innerHeight - height + 1;
    if (!overlap) return;
    const currentPadding = parseFloat(getComputedStyle(document.body).paddingBottom) || 0;
    if (currentPadding < 60) {
      document.body.style.paddingBottom = "90px";
    }
  };

  const init = () => {
    if (document.getElementById("ddt-player")) return;
    const styleLink = ensureStyles();
    const player = buildPlayerMarkup();
    player.style.display = "block";
    document.body.appendChild(player);
    if (styleLink) {
      styleLink.addEventListener("load", () => {
        if (player.style.display) {
          player.style.removeProperty("display");
        }
      });
    }
    setBodyPadding(player);
    window.addEventListener("resize", () => setBodyPadding(player));
    ensureScript();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      try {
        init();
      } catch (err) {
        console.error("[ddt-player] init failed:", err);
      }
    }, { once: true });
  } else {
    try {
      init();
    } catch (err) {
      console.error("[ddt-player] init failed:", err);
    }
  }
})();
