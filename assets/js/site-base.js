(() => {
  const normalizeBase = (base) => {
    if (!base) return "/";
    let next = base.trim();
    if (!next.startsWith("/")) next = `/${next}`;
    if (!next.endsWith("/")) next += "/";
    return next;
  };

  if (window.SITE_BASE) {
    window.SITE_BASE = normalizeBase(window.SITE_BASE);
    return;
  }

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

  window.SITE_BASE = normalizeBase(base);
})();
