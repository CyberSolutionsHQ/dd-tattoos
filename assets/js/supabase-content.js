(() => {
  const CONFIG_STORAGE_KEY = "ddt_supabase_config";
  const SUPABASE_SDK = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  const DEFAULT_CONFIG = {
    url: "https://krjapailmcsrmaugbgew.supabase.co",
    anonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyamFwYWlsbWNzcm1hdWdiZ2V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMjEyNjcsImV4cCI6MjA5NjY5NzI2N30.hJewI7BL0rs3Nty4o7SKpn5fa5tz5CBiApf2vxTU1ZM"
  };

  const readStoredConfig = () => {
    try {
      return JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) || "null");
    } catch (err) {
      return null;
    }
  };

  const getConfig = () => {
    const configured = window.DDT_SUPABASE_CONFIG || readStoredConfig() || DEFAULT_CONFIG;
    if (!configured || !configured.url || !configured.anonKey) return null;
    return configured;
  };

  const getSiteBase = () => {
    const base = window.SITE_BASE || "/";
    return base.endsWith("/") ? base : `${base}/`;
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const loadSdk = () =>
    new Promise((resolve, reject) => {
      if (window.supabase?.createClient) {
        resolve(window.supabase);
        return;
      }
      const script = document.createElement("script");
      script.src = SUPABASE_SDK;
      script.onload = () => resolve(window.supabase);
      script.onerror = () => reject(new Error("Supabase SDK failed to load"));
      document.head.appendChild(script);
    });

  const setText = (key, value) => {
    if (value == null || value === "") return;
    document.querySelectorAll(`[data-site-setting="${key}"]`).forEach((el) => {
      el.textContent = value;
    });
  };

  const setLink = (key, value) => {
    if (!value) return;
    document.querySelectorAll(`[data-social="${key}"], [data-site-link="${key}"]`).forEach((el) => {
      el.href = value;
    });
  };

  const hydrateSettings = async (client) => {
    const { data, error } = await client.from("site_settings").select("*").eq("id", 1).maybeSingle();
    if (error || !data) return;
    Object.entries(data).forEach(([key, value]) => setText(key, value));
    setLink("instagram", data.instagram_url);
    setLink("facebook", data.facebook_url);
    setLink("tiktok", data.tiktok_url);
    setLink("booking", data.booking_link);
  };

  const hydrateContentBlocks = async (client) => {
    const { data, error } = await client
      .from("content_blocks")
      .select("section_key,title,body,display_order")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    if (error || !data?.length) return;
    data.forEach((block) => {
      document.querySelectorAll(`[data-content-block-title="${block.section_key}"]`).forEach((el) => {
        el.textContent = block.title;
      });
      document.querySelectorAll(`[data-content-block-body="${block.section_key}"]`).forEach((el) => {
        el.textContent = block.body;
      });
    });
  };

  const serviceMarkup = (service) => {
    const price = service.price_label || (service.base_price != null ? `$${Number(service.base_price).toFixed(2)}` : "");
    return `
      <a class="service" href="${getSiteBase()}services/index.html" data-service-id="${service.id}">
        <span class="service__icon" aria-hidden="true">&#10022;</span>
        <span>${escapeHtml(service.name)}${price ? ` - ${escapeHtml(price)}` : ""}</span>
      </a>
    `;
  };

  const hydrateServices = async (client) => {
    const target = document.querySelector("[data-services-list]");
    if (!target) return;
    const { data, error } = await client
      .from("services")
      .select("id,name,description,price_label,base_price,display_order")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });
    if (error || !data?.length) return;
    target.innerHTML = data.map(serviceMarkup).join("");
  };

  const artistMarkup = (artist) => `
    <article class="card artist-card" data-artist-id="${artist.id}">
      <div class="artist-card-portrait-frame">
        <img class="artist-card__portrait artist-card-portrait" src="${artist.profile_image_url || `${getSiteBase()}assets/artists/kathy-scheeler.png`}" alt="Portrait of ${escapeHtml(artist.name)}" loading="lazy" decoding="async" />
      </div>
      <div class="artist-card__content">
        <h3>${escapeHtml(artist.name)}</h3>
        <p class="role">${escapeHtml(artist.specialty || "Artist")}</p>
        <p class="artist-handle">${escapeHtml(artist.instagram_url || "")}</p>
        <div class="tags">${artist.specialty ? `<span>${escapeHtml(artist.specialty)}</span>` : ""}</div>
      </div>
      <div class="artist-card__actions">
        <a class="btn btn--ghost" href="${getSiteBase()}artists/${artist.slug}/index.html">View Portfolio</a>
      </div>
    </article>
  `;

  const hydrateArtists = async (client) => {
    const target = document.querySelector("[data-artists-list]");
    if (!target) return;
    const { data, error } = await client
      .from("artists")
      .select("id,name,slug,bio,specialty,years_experience,profile_image_url,instagram_url,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error || !data?.length) return;
    target.innerHTML = data.map(artistMarkup).join("");
  };

  const portfolioMarkup = (image) => `
    <figure class="tome-slot tome-slot--image" data-portfolio-id="${image.id}">
      <img src="${image.image_url}" alt="${escapeHtml(image.alt_text)}" loading="lazy" decoding="async" />
      <figcaption>
        <strong>${escapeHtml(image.title || image.category || "Tattoo work")}</strong>
        ${image.caption ? `<span>${escapeHtml(image.caption)}</span>` : ""}
      </figcaption>
    </figure>
  `;

  const hydratePortfolio = async (client) => {
    const target = document.querySelector("[data-portfolio-list]");
    if (!target) return;
    const artistSlug = target.dataset.artistSlug;
    let query = client
      .from("portfolio_images")
      .select("id,title,caption,category,image_url,alt_text,sort_order,is_featured,artists!inner(slug)")
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (artistSlug) query = query.eq("artists.slug", artistSlug);
    const { data, error } = await query;
    if (error || !data?.length) return;
    const spread = target.querySelector(".tome-spread") || target;
    spread.innerHTML = data.map(portfolioMarkup).join("");
  };

  const init = async () => {
    const config = getConfig();
    if (!config) return;
    try {
      const sdk = await loadSdk();
      const client = sdk.createClient(config.url, config.anonKey);
      await Promise.all([
        hydrateSettings(client),
        hydrateContentBlocks(client),
        hydrateServices(client),
        hydrateArtists(client),
        hydratePortfolio(client)
      ]);
    } catch (err) {
      // Public pages keep checked-in fallback content when Supabase is unavailable.
    }
  };

  init();
})();
