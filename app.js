const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll(".nav-menu a");

const toggleMenu = () => {
  if (!navMenu || !navToggle) return;
  const isOpen = navMenu.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
};

navToggle?.addEventListener("click", toggleMenu);
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (navMenu?.classList.contains("is-open")) {
      navMenu.classList.remove("is-open");
      navToggle?.setAttribute("aria-expanded", "false");
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navMenu?.classList.contains("is-open")) {
    navMenu.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.focus();
  }
});

const revealItems = document.querySelectorAll("[data-reveal]");
if (!prefersReducedMotion.matches) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const countdown = document.querySelector(".countdown");
const updateCountdown = () => {
  if (!countdown) return;
  const targetDate = new Date(countdown.dataset.date || "2026-02-15T18:00:00");
  const now = new Date();
  const diff = targetDate - now;
  if (diff <= 0) {
    const timer = document.getElementById("countdown-timer");
    if (timer) timer.textContent = "Now Open";
    return;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const setValue = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value).padStart(2, "0");
  };

  setValue("days", days);
  setValue("hours", hours);
  setValue("minutes", minutes);
  setValue("seconds", seconds);
};

updateCountdown();
setInterval(updateCountdown, 1000);
