import { siteConfig, categoryOrder, galleryItems } from "./data.js";

const categoryLabels = {
  "bolos-eventos": "Bolos e Eventos",
  brownies: "Brownies",
  cheesecakes: "Cheesecakes",
  "cinnamon-rolls": "Cinnamon Rolls",
};

const highlightsRoot = document.getElementById("highlights-grid");
const galleryRoot = document.getElementById("gallery-grid");
const topbar = document.querySelector(".topbar");
const brandDock = document.querySelector(".brand-dock");

function createWhatsAppUrl(customMessage) {
  const message = (customMessage || siteConfig.whatsappDefaultText || "").trim();
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function applyStaticLinks() {
  document.querySelectorAll("[data-wa]").forEach((node) => {
    const message = node.dataset.waText;
    node.setAttribute("href", createWhatsAppUrl(message));
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  });

  document.querySelectorAll("[data-instagram]").forEach((node) => {
    node.setAttribute("href", siteConfig.instagramUrl);
  });
}

function getCategoryRank(category) {
  const rank = categoryOrder.indexOf(category);
  return rank === -1 ? Number.MAX_SAFE_INTEGER : rank;
}

function sortItems(items) {
  return [...items].sort((a, b) => {
    const byCategory = getCategoryRank(a.category) - getCategoryRank(b.category);
    if (byCategory !== 0) return byCategory;

    const byFeatured = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    if (byFeatured !== 0) return byFeatured;

    return a.title.localeCompare(b.title, "pt-BR");
  });
}

function getMosaicClass(item, index) {
  if (item.layout === "featured" || (item.featured && index === 0)) {
    return "gallery-item is-featured";
  }
  if (item.layout === "wide" || index % 6 === 2) {
    return "gallery-item is-wide";
  }
  if (item.layout === "tall" || index % 6 === 4) {
    return "gallery-item is-tall";
  }
  return "gallery-item";
}

function buildCard(item, options = {}) {
  const article = document.createElement("article");
  article.className = ["card", options.variantClass || "", "reveal"]
    .filter(Boolean)
    .join(" ");

  const media = document.createElement("div");
  media.className = "card-media";

  const image = document.createElement("img");
  image.src = item.image;
  image.alt = item.alt || `Foto de ${item.title}`;
  image.width = 1400;
  image.height = 1050;
  image.loading = "lazy";
  image.decoding = "async";

  const fallback = document.createElement("div");
  fallback.className = "image-fallback";
  fallback.textContent = `Imagem de ${item.title} indisponível no momento.`;

  image.addEventListener("error", () => {
    image.classList.add("is-hidden");
    fallback.classList.add("is-visible");
  });

  media.append(image, fallback);

  const content = document.createElement("div");
  content.className = "card-content";

  const category = document.createElement("p");
  category.className = "card-category";
  category.textContent = categoryLabels[item.category] || "Categoria";

  const title = document.createElement("h3");
  title.textContent = item.title;

  const summary = document.createElement("p");
  summary.textContent = item.summary || "Encomenda artesanal com acabamento personalizado.";

  const price = document.createElement("p");
  price.className = "price-from";
  price.textContent = `A partir de ${item.priceFrom || "sob consulta"}`;

  const cta = document.createElement("a");
  cta.className = "btn btn-primary";
  cta.textContent = "Falar no WhatsApp";
  cta.href = createWhatsAppUrl(item.whatsappText);
  cta.target = "_blank";
  cta.rel = "noopener noreferrer";
  cta.setAttribute("aria-label", `Encomendar ${item.title} no WhatsApp`);

  content.append(category, title, summary, price, cta);
  article.append(media, content);

  return article;
}

function renderHighlights(items) {
  const highlightItems = items
    .filter((item) => item.category === "bolos-eventos")
    .slice(0, 3);

  const finalHighlights = highlightItems.length > 0 ? highlightItems : items.slice(0, 3);

  if (finalHighlights.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent =
      "Ainda não há destaques cadastrados. Adicione itens em assets/js/data.js.";
    highlightsRoot.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  finalHighlights.forEach((item) => {
    fragment.append(buildCard(item));
  });

  highlightsRoot.innerHTML = "";
  highlightsRoot.append(fragment);
}

function renderGallery(items) {
  galleryRoot.innerHTML = "";

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent =
      "Sua galeria está vazia. Inclua novos itens no array galleryItems em assets/js/data.js.";
    galleryRoot.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();

  items.forEach((item, index) => {
    const variantClass = getMosaicClass(item, index);
    fragment.append(buildCard(item, { variantClass }));
  });

  galleryRoot.append(fragment);
}

function setupReveal() {
  const revealNodes = document.querySelectorAll(".reveal");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -32px 0px",
    },
  );

  revealNodes.forEach((node) => observer.observe(node));
}

function setupScrollBranding() {
  let rafId = 0;

  const update = () => {
    rafId = 0;

    const maxScroll = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));

    if (topbar) {
      topbar.classList.toggle("is-compact", window.scrollY > 34);
    }

    document.body.classList.toggle("is-scrolled", window.scrollY > 16);
    document.documentElement.style.setProperty("--scroll-progress", progress.toFixed(4));
    if (brandDock) brandDock.classList.toggle("is-raised", progress > 0.01);
  };

  const requestUpdate = () => {
    if (rafId !== 0) return;
    rafId = window.requestAnimationFrame(update);
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);

  requestUpdate();
}

function setupSectionNavState() {
  const navLinks = Array.from(
    document.querySelectorAll(".top-nav a[href^='#']"),
  );
  if (navLinks.length === 0 || !("IntersectionObserver" in window)) return;

  const linkBySection = new Map();
  navLinks.forEach((link) => {
    const targetId = link.getAttribute("href")?.slice(1);
    if (!targetId) return;
    const section = document.getElementById(targetId);
    if (!section) return;
    linkBySection.set(section, link);
  });

  if (linkBySection.size === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      navLinks.forEach((link) => {
        link.classList.remove("is-active");
        link.removeAttribute("aria-current");
      });

      const activeLink = linkBySection.get(visible.target);
      if (!activeLink) return;
      activeLink.classList.add("is-active");
      activeLink.setAttribute("aria-current", "page");
    },
    {
      threshold: [0.2, 0.45, 0.7],
      rootMargin: "-20% 0px -55% 0px",
    },
  );

  linkBySection.forEach((_, section) => observer.observe(section));
}

function init() {
  applyStaticLinks();

  const sortedItems = sortItems(galleryItems);
  renderHighlights(sortedItems);
  renderGallery(sortedItems);

  setupReveal();
  setupSectionNavState();
  setupScrollBranding();
}

init();
