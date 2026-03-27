/**
 * Ace Consultants — Single Page Site (vanilla JS)
 * Features:
 * - Smooth scroll + offset-friendly section snapping
 * - Sticky navbar style on scroll
 * - Mobile menu toggle (animated hamburger)
 * - Scroll-triggered fade-ins (IntersectionObserver)
 * - Count-up stats on scroll
 * - Pricing category toggle
 * - FAQ accordion with smooth height animation
 * - Contact form validation with inline errors
 * - Active nav link highlighting (scroll spy)
 */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ----------------------------
// Three.js subtle particle background
// ----------------------------
function initThreeBackground() {
  const canvas = document.getElementById("three-bg");
  if (!canvas || !window.THREE || prefersReducedMotion()) return;

  const isMobile = window.innerWidth < 700;
  const particleCount = isMobile ? 450 : 900;
  const THREE = window.THREE;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 52;

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i += 1) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 120;
    positions[i3 + 1] = (Math.random() - 0.5) * 95;
    positions[i3 + 2] = (Math.random() - 0.5) * 80;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x4bd3ff,
    size: isMobile ? 0.24 : 0.18,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  points.rotation.x = 0.15;
  scene.add(points);

  let rafId = 0;
  const clock = new THREE.Clock();
  const mouse = { x: 0, y: 0 };

  function animate() {
    const t = clock.getElapsedTime();
    points.rotation.y = t * 0.03 + mouse.x * 0.08;
    points.rotation.x = 0.15 + Math.sin(t * 0.2) * 0.02 + mouse.y * 0.03;
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(animate);
  }

  function onMouseMove(e) {
    mouse.x = (e.clientX / window.innerWidth - 0.5) * 0.8;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 0.8;
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  document.addEventListener("mousemove", onMouseMove, { passive: true });
  window.addEventListener("resize", onResize);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    } else if (!document.hidden && !rafId) {
      animate();
    }
  });

  animate();
}

initThreeBackground();

// ----------------------------
// Navbar: sticky style on scroll
// ----------------------------
const header = $(".site-header");
const navMenu = $("#nav-menu");
const navToggle = $(".nav-toggle");
const navLinks = $$("[data-nav-link]");

function onScrollHeader() {
  if (!header) return;
  const scrolled = window.scrollY > 12;
  header.classList.toggle("is-scrolled", scrolled);
}

// ----------------------------
// Mobile nav: toggle + close on link
// ----------------------------
function setMenuOpen(open) {
  document.body.classList.toggle("is-menu-open", open);
  navMenu?.classList.toggle("is-open", open);
  if (navToggle) {
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
}

function toggleMenu() {
  const open = document.body.classList.contains("is-menu-open");
  setMenuOpen(!open);
}

navToggle?.addEventListener("click", toggleMenu);

// Close menu when clicking any nav link (mobile)
navLinks.forEach((a) => {
  a.addEventListener("click", () => setMenuOpen(false));
});

// Close menu on Escape
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setMenuOpen(false);
});

// Close menu when clicking outside (mobile)
document.addEventListener("click", (e) => {
  if (!navMenu || !navToggle) return;
  const open = document.body.classList.contains("is-menu-open");
  if (!open) return;
  const target = e.target;
  if (!(target instanceof Element)) return;
  const clickedInside = navMenu.contains(target) || navToggle.contains(target);
  if (!clickedInside) setMenuOpen(false);
});

// ----------------------------
// Smooth scrolling (JS fallback + nicer offset)
// ----------------------------
function getScrollTargetId(anchor) {
  try {
    const url = new URL(anchor.href);
    return url.hash ? url.hash.slice(1) : null;
  } catch {
    return null;
  }
}

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  // Use scroll-margin-top in CSS via JS as a safe baseline
  const y = el.getBoundingClientRect().top + window.scrollY;
  const offset = header ? header.offsetHeight + 12 : 86;
  const top = Math.max(0, y - offset);
  window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

navLinks.forEach((a) => {
  if (!(a instanceof HTMLAnchorElement)) return;
  const id = getScrollTargetId(a);
  if (!id) return;
  a.addEventListener("click", (e) => {
    // Allow ctrl/cmd click and external links
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    // Only intercept in-page links
    if (!a.hash || a.hash === "#") return;
    e.preventDefault();
    scrollToId(id);
    history.pushState(null, "", `#${id}`);
  });
});

// If page loads with a hash, scroll with offset
window.addEventListener("load", () => {
  onScrollHeader();
  const id = location.hash?.slice(1);
  if (id) {
    // delay so layout is stable
    setTimeout(() => scrollToId(id), 50);
  }
});

window.addEventListener("scroll", onScrollHeader, { passive: true });

// ----------------------------
// Scroll-triggered fade-ins
// ----------------------------
const fadeEls = $$(".fade-in");
if ("IntersectionObserver" in window) {
  const fadeObserver = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          obs.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );
  fadeEls.forEach((el) => fadeObserver.observe(el));
} else {
  fadeEls.forEach((el) => el.classList.add("in-view"));
}

// ----------------------------
// Count-up stats on scroll
// ----------------------------
function animateCount(el, endValue, durationMs = 1200) {
  const start = performance.now();
  const isDecimal = String(endValue).includes(".");
  const end = Number(endValue);

  function frame(t) {
    const p = clamp((t - start) / durationMs, 0, 1);
    // easeOutCubic
    const eased = 1 - Math.pow(1 - p, 3);
    const value = end * eased;
    el.textContent = isDecimal ? value.toFixed(1) : Math.round(value).toString();
    if (p < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

const statNumbers = $$("[data-count]");
if ("IntersectionObserver" in window && statNumbers.length) {
  const statObserver = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        const end = el.getAttribute("data-count");
        if (!end) continue;
        animateCount(el, end, prefersReducedMotion() ? 1 : 1200);
        obs.unobserve(el);
      }
    },
    { threshold: 0.5 }
  );
  statNumbers.forEach((el) => statObserver.observe(el));
} else {
  statNumbers.forEach((el) => {
    const end = el.getAttribute("data-count");
    if (end) el.textContent = end;
  });
}

// ----------------------------
// Pricing toggle
// ----------------------------
const pricingButtons = $$("[data-pricing]");
const pricingPanels = $$("[data-pricing-panel]");

function setPricing(category) {
  pricingButtons.forEach((btn) => {
    const active = btn.getAttribute("data-pricing") === category;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", String(active));
  });

  pricingPanels.forEach((panel) => {
    const active = panel.getAttribute("data-pricing-panel") === category;
    panel.classList.toggle("is-active", active);
    panel.setAttribute("aria-hidden", String(!active));
  });
}

pricingButtons.forEach((btn) => {
  btn.addEventListener("click", () => setPricing(btn.getAttribute("data-pricing")));
});

// ----------------------------
// FAQ accordion (smooth height)
// ----------------------------
const accordion = $("[data-accordion]");
if (accordion) {
  const items = $$(".faq-item", accordion);

  function closeItem(item) {
    const q = $(".faq-q", item);
    const a = $(".faq-a", item);
    if (!q || !a) return;
    item.classList.remove("is-open");
    q.setAttribute("aria-expanded", "false");
    a.style.maxHeight = "0px";
  }

  function openItem(item) {
    const q = $(".faq-q", item);
    const a = $(".faq-a", item);
    if (!q || !a) return;
    item.classList.add("is-open");
    q.setAttribute("aria-expanded", "true");
    // set to scrollHeight for smooth transition
    a.style.maxHeight = `${a.scrollHeight}px`;
  }

  // Initialize all closed
  items.forEach((it) => closeItem(it));

  items.forEach((item) => {
    const q = $(".faq-q", item);
    const a = $(".faq-a", item);
    if (!q || !a) return;

    q.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      // close others for a clean accordion feel
      items.forEach((it) => it !== item && closeItem(it));
      if (isOpen) closeItem(item);
      else openItem(item);
    });
  });

  // Recompute open heights on resize (e.g., font wrapping changes)
  window.addEventListener("resize", () => {
    items.forEach((item) => {
      if (!item.classList.contains("is-open")) return;
      const a = $(".faq-a", item);
      if (!a) return;
      a.style.maxHeight = `${a.scrollHeight}px`;
    });
  });
}

// ----------------------------
// Scroll spy: active nav link based on section
// ----------------------------
const sectionIds = ["home", "services", "about", "pricing", "testimonials", "contact"];
const sectionEls = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

function setActiveNav(id) {
  $$("a.nav-link[data-nav-link]").forEach((a) => {
    const href = a.getAttribute("href") || "";
    const active = href === `#${id}`;
    a.classList.toggle("is-active", active);
  });
}

if ("IntersectionObserver" in window && sectionEls.length) {
  const spy = new IntersectionObserver(
    (entries) => {
      // Find the top-most visible section (highest intersection ratio)
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const id = visible.target.id;
      if (sectionIds.includes(id)) setActiveNav(id);
    },
    {
      threshold: [0.15, 0.25, 0.5, 0.75],
      rootMargin: `-${header?.offsetHeight || 74}px 0px -55% 0px`,
    }
  );
  sectionEls.forEach((el) => spy.observe(el));
}

// ----------------------------
// Contact form validation
// ----------------------------
const form = $("#contact-form");
const statusEl = $("#form-status");

function setFieldError(name, message) {
  const field = form?.querySelector(`[name="${name}"]`);
  const error = form?.querySelector(`[data-error-for="${name}"]`);
  if (!field || !error) return;
  const wrapper = field.closest(".field");
  wrapper?.classList.toggle("is-error", Boolean(message));
  error.textContent = message || "";
}

function validateEmail(value) {
  // pragmatic email check (not RFC-complete, intentionally)
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function validatePhone(value) {
  if (!value) return true;
  // allow digits, spaces, parentheses, hyphens, plus
  return /^[0-9\s()+-]{7,}$/.test(value);
}

function validateForm(data) {
  const errors = {};

  const name = (data.get("name") || "").toString().trim();
  const email = (data.get("email") || "").toString().trim();
  const phone = (data.get("phone") || "").toString().trim();
  const service = (data.get("service") || "").toString().trim();
  const message = (data.get("message") || "").toString().trim();

  if (!name) errors.name = "Please enter your full name.";
  else if (name.length < 2) errors.name = "Name looks too short.";

  if (!email) errors.email = "Please enter your email address.";
  else if (!validateEmail(email)) errors.email = "Please enter a valid email (e.g., name@domain.com).";

  if (!validatePhone(phone)) errors.phone = "Please enter a valid phone number or leave it blank.";

  if (!service) errors.service = "Please select a service.";

  if (!message) errors.message = "Please add a short message about your project.";
  else if (message.length < 10) errors.message = "Please add a bit more detail (10+ characters).";

  return errors;
}

function clearAllErrors() {
  ["name", "email", "phone", "service", "message"].forEach((n) => setFieldError(n, ""));
}

if (form) {
  // Real-time validation (lightweight)
  ["name", "email", "phone", "service", "message"].forEach((name) => {
    const input = form.querySelector(`[name="${name}"]`);
    if (!input) return;
    input.addEventListener("input", () => setFieldError(name, ""));
    input.addEventListener("blur", () => {
      const data = new FormData(form);
      const errors = validateForm(data);
      setFieldError(name, errors[name] || "");
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusEl && (statusEl.textContent = "");
    clearAllErrors();

    const data = new FormData(form);
    const errors = validateForm(data);
    const keys = Object.keys(errors);
    if (keys.length) {
      keys.forEach((k) => setFieldError(k, errors[k]));
      const first = form.querySelector(".field.is-error input, .field.is-error select, .field.is-error textarea");
      first?.focus();
      statusEl && (statusEl.textContent = "Please fix the highlighted fields and try again.");
      return;
    }

    // Demo submit: no backend endpoint in this static build.
    // In production, POST the payload to your server/email service.
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    // Simulate network
    await new Promise((r) => setTimeout(r, prefersReducedMotion() ? 50 : 550));

    if (submitBtn) submitBtn.disabled = false;
    form.reset();
    statusEl && (statusEl.textContent = "Thanks! Your message is ready to be sent — we’ll respond within 24 hours.");
  });
}

