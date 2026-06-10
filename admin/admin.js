(() => {
  const CONFIG_STORAGE_KEY = "ddt_supabase_config";
  const DEFAULT_CONFIG = {
    url: "https://krjapailmcsrmaugbgew.supabase.co",
    anonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyamFwYWlsbWNzcm1hdWdiZ2V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMjEyNjcsImV4cCI6MjA5NjY5NzI2N30.hJewI7BL0rs3Nty4o7SKpn5fa5tz5CBiApf2vxTU1ZM"
  };
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
  const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

  let client = null;
  let currentUser = null;
  let currentProfile = null;
  let cachedArtists = [];
  let cachedServices = [];
  let cachedPortfolio = [];
  let cachedBlocks = [];

  const $ = (selector) => document.querySelector(selector);
  const status = $("#admin-status");
  const configForm = $("#config-form");
  const loginForm = $("#login-form");
  const setupPanel = $("#setup-panel");
  const dashboard = $("#dashboard");
  const unauthorizedPanel = $("#unauthorized-panel");

  const setStatus = (message) => {
    status.textContent = message;
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const slugify = (value) =>
    String(value || "unassigned")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "unassigned";

  const readConfig = () => {
    try {
      return JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) || "null");
    } catch (err) {
      return null;
    }
  };

  const saveConfig = (config) => {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  };

  const createClient = (config) => {
    if (!window.supabase?.createClient) {
      setStatus("Supabase SDK could not load. Check your connection and refresh.");
      return null;
    }
    client = window.supabase.createClient(config.url, config.anonKey);
    return client;
  };

  const formValues = (form) => Object.fromEntries(new FormData(form).entries());

  const setVisible = (el, visible) => {
    el.hidden = !visible;
  };

  const setSubmitting = (form, submitting) => {
    form.querySelectorAll("button, input, textarea, select").forEach((el) => {
      el.disabled = submitting;
    });
  };

  const showLogin = () => {
    setVisible(loginForm, true);
    setVisible(setupPanel, true);
    setVisible(dashboard, false);
    setVisible(unauthorizedPanel, false);
  };

  const showDashboard = () => {
    setVisible(setupPanel, false);
    setVisible(dashboard, true);
    setVisible(unauthorizedPanel, false);
    $("#admin-user").textContent = currentUser?.email ? `Logged in as ${currentUser.email}` : "";
    $("#admin-role-status").textContent = `Role: ${currentProfile?.role || "unknown"}`;
  };

  const logout = async () => {
    if (client) await client.auth.signOut();
    currentUser = null;
    currentProfile = null;
    showLogin();
    setStatus("Logged out.");
  };

  const requireAdmin = async () => {
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError || !userData?.user) {
      showLogin();
      setStatus("Please log in.");
      return false;
    }

    currentUser = userData.user;
    const { data, error } = await client
      .from("profiles")
      .select("email, display_name, role")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (error || data?.role !== "admin") {
      setVisible(setupPanel, false);
      setVisible(dashboard, false);
      setVisible(unauthorizedPanel, true);
      setStatus("Access denied.");
      return false;
    }

    currentProfile = data;
    showDashboard();
    setStatus("Admin access verified.");
    return true;
  };

  const validateImageFile = (file) => {
    if (!file || !file.name) return;
    const ext = `.${file.name.split(".").pop().toLowerCase()}`;
    if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error("Images must be JPG, PNG, or WebP.");
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error("Images must be 5 MB or smaller.");
    }
  };

  const uploadImage = async (bucket, file, folder) => {
    validateImageFile(file);
    const ext = `.${file.name.split(".").pop().toLowerCase()}`;
    const safeBase = slugify(file.name.replace(/\.[^.]+$/, ""));
    const storagePath = `${slugify(folder)}/${crypto.randomUUID()}-${safeBase}${ext}`;
    const { error } = await client.storage.from(bucket).upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false
    });
    if (error) throw error;
    const { data } = client.storage.from(bucket).getPublicUrl(storagePath);
    return { publicUrl: data.publicUrl, storagePath };
  };

  const removeStorageObject = async (bucket, storagePath) => {
    if (!storagePath) return;
    const { error } = await client.storage.from(bucket).remove([storagePath]);
    if (error) throw error;
  };

  const setFormData = (form, data) => {
    form.reset();
    Object.entries(data || {}).forEach(([key, value]) => {
      const field = form.elements[key];
      if (!field) return;
      if (field.type === "checkbox") {
        field.checked = Boolean(value);
      } else {
        field.value = Array.isArray(value) ? value.join(", ") : value ?? "";
      }
    });
  };

  const renderActions = (type, id, extra = "") => `
    <div class="admin-item__actions">
      <button class="btn btn--ghost" type="button" data-edit="${type}" data-id="${id}">Edit</button>
      ${extra}
      <button class="btn btn--ghost" type="button" data-delete="${type}" data-id="${id}">Delete</button>
    </div>
  `;

  const loadSettings = async () => {
    const { data, error } = await client.from("site_settings").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    setFormData($("#settings-form"), data || { id: 1 });
    $("#stat-settings").textContent = data ? "Ready" : "Missing";
  };

  const loadServices = async () => {
    const { data = [], error } = await client.from("services").select("*").order("display_order").order("name");
    if (error) throw error;
    cachedServices = data;
    $("#stat-services").textContent = String(data.length);
    $("#services-list").innerHTML = data
      .map(
        (service) => `
          <article class="admin-item">
            <h3>${escapeHtml(service.name)}</h3>
            <p>${escapeHtml(service.price_label || "No price label")} - ${service.is_active ? "Active" : "Hidden"} - Order ${service.display_order}</p>
            ${renderActions("service", service.id)}
          </article>
        `
      )
      .join("");
  };

  const loadArtists = async () => {
    const { data = [], error } = await client.from("artists").select("*").order("sort_order").order("name");
    if (error) throw error;
    cachedArtists = data;
    $("#stat-artists").textContent = String(data.length);
    $("#artists-list").innerHTML = data
      .map(
        (artist) => `
          <article class="admin-item">
            <h3>${escapeHtml(artist.name)}</h3>
            <p>${escapeHtml(artist.specialty || "No specialty set")} - ${artist.is_active ? "Active" : "Hidden"} - Order ${artist.sort_order}</p>
            ${renderActions("artist", artist.id, artist.profile_image_path ? `<button class="btn btn--ghost" type="button" data-remove-photo="${artist.id}">Remove Photo</button>` : "")}
          </article>
        `
      )
      .join("");
    $("#portfolio-artist").innerHTML = `<option value="">Unassigned</option>${data
      .map((artist) => `<option value="${artist.id}">${escapeHtml(artist.name)}</option>`)
      .join("")}`;
  };

  const loadPortfolio = async () => {
    const { data = [], error } = await client
      .from("portfolio_images")
      .select("*, artists(name, slug)")
      .order("sort_order")
      .order("created_at", { ascending: false });
    if (error) throw error;
    cachedPortfolio = data;
    $("#stat-portfolio").textContent = String(data.length);
    $("#portfolio-list").innerHTML = data
      .map(
        (image) => `
          <article class="admin-item">
            <h3>${escapeHtml(image.title || image.alt_text)}</h3>
            <p>${escapeHtml(image.artists?.name || "Unassigned")} - ${image.is_published ? "Published" : "Draft"}${image.is_featured ? " - Featured" : ""} - Order ${image.sort_order}</p>
            ${renderActions("portfolio", image.id)}
          </article>
        `
      )
      .join("");
  };

  const loadContentBlocks = async () => {
    const { data = [], error } = await client.from("content_blocks").select("*").order("display_order").order("section_key");
    if (error) throw error;
    cachedBlocks = data;
    $("#stat-blocks").textContent = String(data.length);
    $("#content-blocks-list").innerHTML = data
      .map(
        (block) => `
          <article class="admin-item">
            <h3>${escapeHtml(block.section_key)}</h3>
            <p>${escapeHtml(block.title)} - ${block.is_active ? "Active" : "Hidden"} - Order ${block.display_order}</p>
            ${renderActions("content-block", block.id)}
          </article>
        `
      )
      .join("");
  };

  const updateLastUpdated = async () => {
    const tables = ["site_settings", "services", "artists", "portfolio_images", "content_blocks"];
    const checks = await Promise.all(
      tables.map(async (table) => {
        const { data } = await client.from(table).select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle();
        return { table, updated_at: data?.updated_at };
      })
    );
    const latest = checks.filter((item) => item.updated_at).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
    $("#admin-last-updated").textContent = latest
      ? `Last updated content: ${latest.table} at ${new Date(latest.updated_at).toLocaleString()}`
      : "Last updated content: none yet.";
  };

  const refreshDashboard = async () => {
    await Promise.all([loadSettings(), loadServices(), loadArtists(), loadPortfolio(), loadContentBlocks()]);
    await updateLastUpdated();
  };

  configForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = formValues(configForm);
    saveConfig({ url: values.url, anonKey: values.anonKey });
    if (createClient({ url: values.url, anonKey: values.anonKey })) {
      showLogin();
      setStatus("Connection saved. Log in with a Supabase admin account.");
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!client) {
      setStatus("Save the Supabase connection before logging in.");
      return;
    }
    const values = formValues(loginForm);
    setSubmitting(loginForm, true);
    const { error } = await client.auth.signInWithPassword({ email: values.email, password: values.password });
    setSubmitting(loginForm, false);
    if (error) {
      setStatus(error.message);
      return;
    }
    if (await requireAdmin()) await refreshDashboard();
  });

  $("#settings-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = formValues(form);
    setSubmitting(form, true);
    const payload = {
      id: 1,
      site_title: values.site_title,
      tagline: values.tagline,
      hero_heading: values.hero_heading,
      hero_subheading: values.hero_subheading,
      about_heading: values.about_heading,
      about_body: values.about_body,
      phone: values.phone || null,
      email: values.email || null,
      address: values.address || null,
      hours: values.hours,
      facebook_url: values.facebook_url || null,
      instagram_url: values.instagram_url || null,
      tiktok_url: values.tiktok_url || null,
      booking_link: values.booking_link || null,
      updated_by: currentUser.id
    };
    const { error } = await client.from("site_settings").upsert(payload);
    setSubmitting(form, false);
    setStatus(error ? error.message : "Site settings saved.");
    if (!error) await refreshDashboard();
  });

  $("#service-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = formValues(form);
    setSubmitting(form, true);
    const payload = {
      name: values.name,
      description: values.description,
      price_label: values.price_label || null,
      base_price: values.base_price ? Number(values.base_price) : null,
      display_order: Number(values.display_order || 0),
      is_active: Boolean(form.elements.is_active.checked),
      updated_by: currentUser.id
    };
    const request = values.id
      ? client.from("services").update(payload).eq("id", values.id)
      : client.from("services").insert(payload);
    const { error } = await request;
    setSubmitting(form, false);
    setStatus(error ? error.message : "Service saved.");
    if (!error) {
      form.reset();
      await refreshDashboard();
    }
  });

  $("#artist-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = formValues(form);
    setSubmitting(form, true);
    try {
      let profileImageUrl = values.profile_image_url || null;
      let profileImagePath = values.profile_image_path || null;
      const file = form.elements.photo_file.files[0];

      if (form.elements.remove_photo.checked && profileImagePath) {
        await removeStorageObject("artist-photos", profileImagePath);
        profileImageUrl = null;
        profileImagePath = null;
      }

      if (file) {
        if (profileImagePath) await removeStorageObject("artist-photos", profileImagePath);
        const upload = await uploadImage("artist-photos", file, values.slug || values.name);
        profileImageUrl = upload.publicUrl;
        profileImagePath = upload.storagePath;
      }

      const payload = {
        name: values.name,
        slug: slugify(values.slug),
        bio: values.bio,
        specialty: values.specialty || null,
        years_experience: values.years_experience ? Number(values.years_experience) : null,
        profile_image_url: profileImageUrl,
        profile_image_path: profileImagePath,
        instagram_url: values.instagram_url || null,
        sort_order: Number(values.sort_order || 0),
        is_active: Boolean(form.elements.is_active.checked),
        updated_by: currentUser.id
      };
      const request = values.id
        ? client.from("artists").update(payload).eq("id", values.id)
        : client.from("artists").insert(payload);
      const { error } = await request;
      if (error) throw error;
      form.reset();
      setStatus("Artist saved.");
      await refreshDashboard();
    } catch (err) {
      setStatus(err.message);
    } finally {
      setSubmitting(form, false);
    }
  });

  $("#portfolio-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = formValues(form);
    setSubmitting(form, true);
    try {
      let imageUrl = values.image_url || null;
      let storagePath = values.storage_path || null;
      const file = form.elements.image_file.files[0];
      const artist = cachedArtists.find((item) => item.id === values.artist_id);

      if (!values.id && !file) {
        throw new Error("Choose an image before creating a portfolio item.");
      }

      if (file) {
        if (storagePath) await removeStorageObject("portfolio", storagePath);
        const upload = await uploadImage("portfolio", file, artist?.slug || "unassigned");
        imageUrl = upload.publicUrl;
        storagePath = upload.storagePath;
      }

      const payload = {
        artist_id: values.artist_id || null,
        title: values.title || null,
        caption: values.caption || null,
        category: values.category || null,
        image_url: imageUrl,
        storage_path: storagePath,
        alt_text: values.alt_text,
        sort_order: Number(values.sort_order || 0),
        is_featured: Boolean(form.elements.is_featured.checked),
        is_published: Boolean(form.elements.is_published.checked),
        updated_by: currentUser.id
      };
      const request = values.id
        ? client.from("portfolio_images").update(payload).eq("id", values.id)
        : client.from("portfolio_images").insert(payload);
      const { error } = await request;
      if (error) throw error;
      form.reset();
      setStatus("Portfolio image saved.");
      await refreshDashboard();
    } catch (err) {
      setStatus(err.message);
    } finally {
      setSubmitting(form, false);
    }
  });

  $("#content-block-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = formValues(form);
    setSubmitting(form, true);
    const payload = {
      section_key: slugify(values.section_key).replaceAll("-", "_"),
      title: values.title,
      body: values.body,
      display_order: Number(values.display_order || 0),
      is_active: Boolean(form.elements.is_active.checked),
      updated_by: currentUser.id
    };
    const request = values.id
      ? client.from("content_blocks").update(payload).eq("id", values.id)
      : client.from("content_blocks").insert(payload);
    const { error } = await request;
    setSubmitting(form, false);
    setStatus(error ? error.message : "Content block saved.");
    if (!error) {
      form.reset();
      await refreshDashboard();
    }
  });

  document.addEventListener("click", async (event) => {
    const tab = event.target.closest("[data-tab]");
    if (tab) {
      document.querySelectorAll("[data-tab]").forEach((el) => el.classList.toggle("is-active", el === tab));
      document.querySelectorAll("[data-panel]").forEach((el) => el.classList.toggle("is-active", el.dataset.panel === tab.dataset.tab));
    }

    if (event.target.closest('[data-action="logout"]')) await logout();

    const removePhotoButton = event.target.closest("[data-remove-photo]");
    if (removePhotoButton) {
      const artist = cachedArtists.find((item) => item.id === removePhotoButton.dataset.removePhoto);
      if (!artist?.profile_image_path) return;
      try {
        await removeStorageObject("artist-photos", artist.profile_image_path);
        const { error } = await client
          .from("artists")
          .update({ profile_image_url: null, profile_image_path: null, updated_by: currentUser.id })
          .eq("id", artist.id);
        if (error) throw error;
        setStatus("Artist photo removed.");
        await refreshDashboard();
      } catch (err) {
        setStatus(err.message);
      }
    }

    const deleteButton = event.target.closest("[data-delete]");
    if (deleteButton) {
      const type = deleteButton.dataset.delete;
      const tables = {
        service: "services",
        artist: "artists",
        portfolio: "portfolio_images",
        "content-block": "content_blocks"
      };
      if (!window.confirm("Delete this item? This cannot be undone.")) return;
      try {
        if (type === "portfolio") {
          const item = cachedPortfolio.find((row) => row.id === deleteButton.dataset.id);
          if (item?.storage_path) await removeStorageObject("portfolio", item.storage_path);
        }
        if (type === "artist") {
          const item = cachedArtists.find((row) => row.id === deleteButton.dataset.id);
          if (item?.profile_image_path) await removeStorageObject("artist-photos", item.profile_image_path);
        }
        const { error } = await client.from(tables[type]).delete().eq("id", deleteButton.dataset.id);
        if (error) throw error;
        setStatus("Deleted.");
        await refreshDashboard();
      } catch (err) {
        setStatus(err.message);
      }
    }

    const editButton = event.target.closest("[data-edit]");
    if (editButton) {
      const type = editButton.dataset.edit;
      const tables = {
        service: "services",
        artist: "artists",
        portfolio: "portfolio_images",
        "content-block": "content_blocks"
      };
      const formIds = {
        service: "service-form",
        artist: "artist-form",
        portfolio: "portfolio-form",
        "content-block": "content-block-form"
      };
      const { data, error } = await client.from(tables[type]).select("*").eq("id", editButton.dataset.id).single();
      if (error) {
        setStatus(error.message);
        return;
      }
      const form = $(`#${formIds[type]}`);
      setFormData(form, data);
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  const init = async () => {
    const saved = readConfig() || DEFAULT_CONFIG;
    if (!saved) {
      setVisible(loginForm, true);
      setStatus("Enter your Supabase public connection details.");
      return;
    }
    $("#supabase-url").value = saved.url || "";
    $("#supabase-anon-key").value = saved.anonKey || "";
    if (!createClient(saved)) return;
    showLogin();
    if (await requireAdmin()) await refreshDashboard();
  };

  init();
})();
