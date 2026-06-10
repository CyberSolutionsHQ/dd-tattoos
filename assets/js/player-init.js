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
    if (document.querySelector("link[data-ddt-player]")) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `${getSiteBase()}assets/css/player.css`;
    link.dataset.ddtPlayer = "true";
    document.head.appendChild(link);
  };

  const ensureScript = (src, marker) => {
    if (document.querySelector(`script[data-${marker}]`)) return;
    const script = document.createElement("script");
    script.src = `${getSiteBase()}${src}`;
    script.defer = true;
    script.dataset[marker] = "true";
    document.body.appendChild(script);
  };

  const init = () => {
    ensureStyles();
    ensureScript("assets/js/supabase-content.js", "ddtContent");
    ensureScript("assets/js/player.js", "ddtPlayer");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
