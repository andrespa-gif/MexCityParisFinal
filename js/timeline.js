(function initTimelines() {
  const data = window.TIMELINE_DATA;
  if (!data) return;

  const overlay = document.getElementById("timeline-overlay");
  const overlayCard = overlay?.querySelector(".overlay-card");
  const watchBtn = document.getElementById("watch-timeline");
  const progressBar = document.getElementById("timeline-progress");
  let animating = false;
  let animTimer = null;

  function renderColumn(city, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = data[city].map((entry, index) => `
      <article class="tl-entry" data-city="${city}" data-index="${index}" tabindex="0">
        <time class="tl-year">${entry.year}</time>
        <h3 class="tl-title">${entry.title}</h3>
        <figure class="tl-thumb">
          <img src="${entry.image}" alt="${entry.imageNote || entry.title}" loading="lazy">
        </figure>
        <p class="tl-summary">${entry.summary}</p>
      </article>
    `).join("");
  }

  renderColumn("paris", "paris-timeline");
  renderColumn("cdmx", "cdmx-timeline");

  function openOverlay(city, index) {
    const entry = data[city][index];
    if (!entry || !overlay || !overlayCard) return;
    overlayCard.innerHTML = `
      <button class="overlay-close" type="button" aria-label="Close">×</button>
      <time class="overlay-year">${entry.year}</time>
      <h2 class="overlay-title">${entry.title}</h2>
      <figure class="overlay-image">
        <img src="${entry.image}" alt="${entry.imageNote || entry.title}">
      </figure>
      ${entry.detail.map((p) => `<p>${p}</p>`).join("")}
      <p class="overlay-inequality"><em>${entry.inequality}</em></p>
    `;
    overlay.hidden = false;
    document.body.classList.add("overlay-open");
    overlayCard.querySelector(".overlay-close")?.addEventListener("click", closeOverlay);
  }

  function closeOverlay() {
    if (!overlay) return;
    overlay.hidden = true;
    document.body.classList.remove("overlay-open");
  }

  document.querySelectorAll(".tl-entry").forEach((entry) => {
    entry.addEventListener("click", () => openOverlay(entry.dataset.city, Number(entry.dataset.index)));
    entry.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openOverlay(entry.dataset.city, Number(entry.dataset.index));
      }
    });
  });

  overlay?.addEventListener("click", (event) => {
    if (event.target === overlay) closeOverlay();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeOverlay();
  });

  function highlightEntry(city, index) {
    document.querySelectorAll(".tl-entry").forEach((el) => el.classList.remove("highlight"));
    const entry = document.querySelector(`.tl-entry[data-city="${city}"][data-index="${index}"]`);
    entry?.classList.add("highlight");
    entry?.scrollIntoView({ behavior: "smooth", block: "center" });
    const mirror = document.querySelector(`.tl-entry[data-city="${city === "paris" ? "cdmx" : "paris"}"][data-index="${index}"]`);
    mirror?.classList.add("highlight");
    mirror?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function stopWatch() {
    animating = false;
    if (animTimer) window.clearTimeout(animTimer);
    if (watchBtn) watchBtn.textContent = "▶ Watch the timeline";
    if (progressBar) progressBar.style.width = "0%";
  }

  function runWatch(step = 0) {
    if (!animating) return;
    const total = data.paris.length;
    highlightEntry("paris", step);
    if (progressBar) progressBar.style.width = `${((step + 1) / total) * 100}%`;
    animTimer = window.setTimeout(() => {
      const next = step + 1;
      if (next >= total) stopWatch();
      else runWatch(next);
    }, 3000);
  }

  watchBtn?.addEventListener("click", () => {
    if (animating) {
      stopWatch();
      return;
    }
    animating = true;
    watchBtn.textContent = "Stop";
    runWatch(0);
  });
})();
