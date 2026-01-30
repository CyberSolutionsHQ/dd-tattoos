(() => {
  const ensureStyles = () => {
    if (document.querySelector("link[data-ddt-player]")) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/assets/css/player.css";
    link.dataset.ddtPlayer = "true";
    document.head.appendChild(link);
  };

  const ensureScript = () => {
    if (document.querySelector("script[data-ddt-player]")) return;
    const script = document.createElement("script");
    script.src = "/assets/js/player.js";
    script.defer = true;
    script.dataset.ddtPlayer = "true";
    document.body.appendChild(script);
  };

  const buildPlayerMarkup = () => {
    const player = document.createElement("div");
    player.id = "ddt-player";
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
    `;
    return player;
  };

  const setBodyPadding = (player) => {
    const height = player.offsetHeight || 110;
    document.documentElement.style.setProperty("--ddt-player-height", `${height}px`);
  };

  const init = () => {
    if (document.getElementById("ddt-player")) return;
    ensureStyles();
    const player = buildPlayerMarkup();
    document.body.appendChild(player);
    setBodyPadding(player);
    window.addEventListener("resize", () => setBodyPadding(player));
    ensureScript();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
