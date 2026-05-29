window.createCityLab = function createCityLab(config) {
  const {
    neighborhoodKey = "alcaldias",
    aliases = new Map(),
    shortName = (name) => name,
    featureName = (feature) => feature.properties?.alcaldia || feature.properties?.name || feature.properties?.NOMGEO || "",
    matchSlug: customMatchSlug,
    manageControls = true,
    initNav = true,
    mapWidth = 980,
    mapHeight = 620,
    hdiMapHeight = 500,
    chartWidth = 980,
    chartHeight = 560,
    compactVariables = true
  } = config;

  const state = {
    data: null,
    boundaries: null,
    decade: "2020",
    hdiMapYear: "2020",
    scatterYear: "2020",
    selectedVariables: new Set(),
    scores: new Map(),
    playTimer: null
  };

  const elements = {
    decadeLabel: "decadeLabel",
    decadeSlider: "decadeSlider",
    decadeTicks: "decadeTicks",
    playDecades: "playDecades",
    variableControls: "variableControls",
    resetVariables: "resetVariables",
    uqiMapLabel: "uqiMapLabel",
    hdiMapLabel: "hdiMapLabel",
    scatterLabel: "scatterLabel",
    uqiMap: "uqiMap",
    hdiMap: "hdiMap",
    scatterPlot: "scatterPlot",
    uqiLineChart: "uqiLineChart",
    ...(config.elements || {})
  };

  function el(id) {
    return document.getElementById(elements[id] || id);
  }
  const uqiPalette = ["#c9544d", "#dd875c", "#e4c15e", "#93bd73", "#4f9a63"];
  const hdiPalette = ["#ddd7ca", "#b9c6e5", "#91a7dd", "#607fc2", "#314f9f"];
  const tooltip = document.getElementById("tooltip");

  function slug(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  }

  function matchSlug(value) {
    if (customMatchSlug) return customMatchSlug(value);
    const s = slug(value);
    return aliases.get(s) || s;
  }

  function neighborhoods() {
    return state.data[neighborhoodKey] || state.data.alcaldias || state.data.arrondissements || [];
  }

  function boot(data, boundaries) {
    state.data = data;
    state.boundaries = boundaries;
    state.decade = data.decades[data.decades.length - 1];
    const hdiYears = data.hdiYears || ["2020"];
    state.hdiMapYear = hdiYears[hdiYears.length - 1];
    state.scatterYear = state.hdiMapYear;
    data.variables.filter((variable) => variable.defaultSelected).forEach((variable) => state.selectedVariables.add(variable.key));
    if (manageControls) initControls();
    if (initNav) initRevealAndNav();
    renderAll();
  }

  function initControls() {
    const decadeSlider = el("decadeSlider");
    if (decadeSlider) {
      decadeSlider.max = state.data.decades.length - 1;
      decadeSlider.value = state.data.decades.indexOf(state.decade);
      const ticks = el("decadeTicks");
      if (ticks) ticks.innerHTML = state.data.decades.map((decade, index) => index % 4 === 0 || index === state.data.decades.length - 1 ? `<span>${decade}</span>` : "<span></span>").join("");
      decadeSlider.addEventListener("input", (event) => {
        state.decade = state.data.decades[Number(event.target.value)];
        stopDecadePlayback();
        renderAll();
      });
    }

    el("playDecades")?.addEventListener("click", () => {
      if (state.playTimer) stopDecadePlayback();
      else startDecadePlayback();
    });

    const controls = el("variableControls");
    if (!controls) return;
    controls.innerHTML = state.data.variables.map((variable) => {
      const note = state.data.sourceNotes?.[variable.key] || variable.description;
      if (compactVariables) {
        return `<label class="variable-toggle variable-toggle-compact" title="${variable.description}. Source: ${note}"><input type="checkbox" value="${variable.key}" ${state.selectedVariables.has(variable.key) ? "checked" : ""}><span>${variable.label}</span></label>`;
      }
      return `<label class="variable-toggle"><input type="checkbox" value="${variable.key}" ${state.selectedVariables.has(variable.key) ? "checked" : ""}><span>${variable.label}<small>${variable.description}</small><em class="method-note">* ${note}</em></span></label>`;
    }).join("");
    controls.addEventListener("change", (event) => {
      if (!event.target.matches("input[type='checkbox']")) return;
      if (event.target.checked) state.selectedVariables.add(event.target.value);
      else state.selectedVariables.delete(event.target.value);
      renderAll();
    });
    el("resetVariables")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      state.selectedVariables = new Set(state.data.variables.filter((variable) => variable.defaultSelected).map((variable) => variable.key));
      controls.querySelectorAll("input").forEach((input) => input.checked = state.selectedVariables.has(input.value));
      renderAll();
    });
  }

  function startDecadePlayback() {
    const button = el("playDecades");
    if (button) button.textContent = "Pause";
    state.playTimer = window.setInterval(() => {
      const currentIndex = state.data.decades.indexOf(state.decade);
      const nextIndex = currentIndex >= state.data.decades.length - 1 ? 0 : currentIndex + 1;
      state.decade = state.data.decades[nextIndex];
      const slider = el("decadeSlider");
      if (slider) slider.value = nextIndex;
      renderAll();
    }, 850);
  }

  function stopDecadePlayback() {
    if (state.playTimer) window.clearInterval(state.playTimer);
    state.playTimer = null;
    const button = el("playDecades");
    if (button) button.textContent = "Play";
  }

  function selectedVariables() {
    return state.data.variables.filter((variable) => state.selectedVariables.has(variable.key));
  }

  function valuesForDecade(variableKey, decade) {
    return neighborhoods().map((item) => item.values?.[decade]?.[variableKey]).filter((value) => typeof value === "number" && Number.isFinite(value));
  }

  function normalize(value, variable, decade) {
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    const values = valuesForDecade(variable.key, decade);
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return 0.5;
    const raw = (value - min) / (max - min);
    return variable.higherIsBetter ? raw : 1 - raw;
  }

  function scoreNeighborhood(item, decade = state.decade) {
    const parts = selectedVariables().map((variable) => normalize(item.values?.[decade]?.[variable.key], variable, decade)).filter((value) => value !== null);
    return parts.length ? parts.reduce((sum, value) => sum + value, 0) / parts.length : null;
  }

  function computeScores(decade = state.decade) {
    const bySlug = new Map();
    neighborhoods().forEach((item) => bySlug.set(matchSlug(item.name), { item, score: scoreNeighborhood(item, decade) }));
    if (decade === state.decade) state.scores = bySlug;
    return bySlug;
  }

  function colorFromScore(score, palette) {
    if (score === null || score === undefined || Number.isNaN(score)) return "#c9c5ba";
    if (score < 0.2) return palette[0];
    if (score < 0.4) return palette[1];
    if (score < 0.6) return palette[2];
    if (score < 0.8) return palette[3];
    return palette[4];
  }

  function colorFromHdi(hdi) {
    if (typeof hdi !== "number") return "#c9c5ba";
    return colorFromScore(Math.max(0, Math.min(1, (hdi - 0.65) / 0.30)), hdiPalette);
  }

  function getAllPoints(geometry) {
    const points = [];
    const visit = (coords) => {
      if (!Array.isArray(coords)) return;
      if (typeof coords[0] === "number" && typeof coords[1] === "number") points.push(coords);
      else coords.forEach(visit);
    };
    visit(geometry.coordinates);
    return points;
  }

  function geoBounds(features) {
    const points = features.flatMap((feature) => getAllPoints(feature.geometry));
    return { minX: Math.min(...points.map((p) => p[0])), maxX: Math.max(...points.map((p) => p[0])), minY: Math.min(...points.map((p) => p[1])), maxY: Math.max(...points.map((p) => p[1])) };
  }

  function projector(bounds, width, height, padding) {
    const scale = Math.min((width - padding * 2) / (bounds.maxX - bounds.minX), (height - padding * 2) / (bounds.maxY - bounds.minY));
    const usedWidth = (bounds.maxX - bounds.minX) * scale;
    const usedHeight = (bounds.maxY - bounds.minY) * scale;
    const offsetX = (width - usedWidth) / 2;
    const offsetY = (height - usedHeight) / 2;
    return ([lon, lat]) => [offsetX + (lon - bounds.minX) * scale, height - offsetY - (lat - bounds.minY) * scale];
  }

  function ringPath(ring, project) {
    return ring.map((point, index) => {
      const [x, y] = project(point);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(" ") + " Z";
  }

  function geometryPath(geometry, project) {
    if (geometry.type === "Polygon") return geometry.coordinates.map((ring) => ringPath(ring, project)).join(" ");
    if (geometry.type === "MultiPolygon") return geometry.coordinates.flatMap((poly) => poly.map((ring) => ringPath(ring, project))).join(" ");
    return "";
  }

  function geometryCentroid(geometry, project) {
    const projected = getAllPoints(geometry).map(project);
    return [projected.reduce((sum, point) => sum + point[0], 0) / projected.length, projected.reduce((sum, point) => sum + point[1], 0) / projected.length];
  }

  function nearestHdiYear(decade) {
    const years = state.data.hdiYears || Object.keys(neighborhoods()[0]?.hdi || {});
    if (!years.length) return null;
    const target = Number(decade);
    return years.reduce((best, year) => Math.abs(Number(year) - target) < Math.abs(Number(best) - target) ? year : best, years[0]);
  }

  function renderAll() {
    computeScores();
    if (el("decadeLabel")) el("decadeLabel").textContent = state.decade;
    const decadeSlider = el("decadeSlider");
    if (decadeSlider) decadeSlider.value = state.data.decades.indexOf(state.decade);
    if (el("uqiMapLabel")) el("uqiMapLabel").textContent = state.decade;
    state.hdiMapYear = nearestHdiYear(state.decade) || "2020";
    state.scatterYear = state.hdiMapYear;
    if (el("hdiMapLabel")) el("hdiMapLabel").textContent = state.hdiMapYear;
    if (el("scatterLabel")) el("scatterLabel").textContent = state.hdiMapYear;
    renderMap("uqiMap", "uqi");
    renderMap("hdiMap", "hdi");
    renderScatter();
    renderUqiLineChart();
  }

  function renderMap(elementKey, mode) {
    const target = el(elementKey);
    if (!target || !state.boundaries) return;
    const width = mode === "uqi" ? mapWidth : Math.min(mapWidth, 760);
    const height = mode === "uqi" ? mapHeight : hdiMapHeight;
    const bounds = geoBounds(state.boundaries.features);
    const project = projector(bounds, width, height, 26);
    const uqiScores = computeScores(state.decade);
    const paths = state.boundaries.features.map((feature) => {
      const name = featureName(feature);
      const record = uqiScores.get(matchSlug(name));
      const hdi = record?.item?.hdi?.[state.hdiMapYear];
      const fill = mode === "uqi" ? colorFromScore(record?.score, uqiPalette) : colorFromHdi(hdi);
      const value = mode === "uqi" ? (record?.score == null ? "n/a" : Math.round(record.score * 100)) : (hdi == null ? "n/a" : hdi.toFixed(3));
      return `<path class="alcaldia-path" d="${geometryPath(feature.geometry, project)}" fill="${fill}" data-mode="${mode}" data-name="${name}" data-value="${value}"></path>`;
    }).join("");
    const labels = state.boundaries.features.map((feature) => {
      const [x, y] = geometryCentroid(feature.geometry, project);
      return `<text class="map-label" x="${x.toFixed(1)}" y="${y.toFixed(1)}">${shortName(featureName(feature))}</text>`;
    }).join("");
    target.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img"><rect width="${width}" height="${height}" fill="#eef0ec"></rect><g>${paths}</g><g>${labels}</g></svg>`;
    target.querySelectorAll(".alcaldia-path").forEach((path) => {
      path.addEventListener("mousemove", (event) => showMapTooltip(event, path.dataset.mode, path.dataset.name, path.dataset.value));
      path.addEventListener("mouseleave", hideTooltip);
    });
  }

  function scatterRows() {
    const scores = computeScores(state.scatterYear);
    return neighborhoods().map((item) => ({ item, uqi: scores.get(matchSlug(item.name))?.score, hdi: item.hdi?.[state.scatterYear] })).filter((row) => typeof row.uqi === "number" && typeof row.hdi === "number");
  }

  function renderScatter() {
    const target = el("scatterPlot");
    if (!target) return;
    const rows = scatterRows();
    if (!rows.length) {
      target.innerHTML = `<div class="note" style="padding:24px">HDI not available for this decade.</div>`;
      return;
    }
    const width = chartWidth;
    const height = chartHeight;
    const margin = { top: 28, right: 34, bottom: 58, left: 64 };
    const minX = Math.max(0, Math.min(...rows.map((row) => row.uqi)) - 0.05);
    const maxX = Math.min(1, Math.max(...rows.map((row) => row.uqi)) + 0.05);
    const minY = Math.min(...rows.map((row) => row.hdi)) - 0.015;
    const maxY = Math.max(...rows.map((row) => row.hdi)) + 0.015;
    const x = (value) => margin.left + ((value - minX) / (maxX - minX)) * (width - margin.left - margin.right);
    const y = (value) => margin.top + (1 - (value - minY) / (maxY - minY)) * (height - margin.top - margin.bottom);
    const meanX = rows.reduce((sum, row) => sum + row.uqi, 0) / rows.length;
    const meanY = rows.reduce((sum, row) => sum + row.hdi, 0) / rows.length;
    const slope = rows.reduce((sum, row) => sum + (row.uqi - meanX) * (row.hdi - meanY), 0) / rows.reduce((sum, row) => sum + (row.uqi - meanX) ** 2, 0);
    const intercept = meanY - slope * meanX;
    const lineY1 = intercept + slope * minX;
    const lineY2 = intercept + slope * maxX;
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => {
      const yy = margin.top + (1 - t) * (height - margin.top - margin.bottom);
      const label = (minY + t * (maxY - minY)).toFixed(2);
      return `<line class="grid" x1="${margin.left}" x2="${width - margin.right}" y1="${yy}" y2="${yy}"></line><text class="axis-label" x="${margin.left - 10}" y="${yy + 4}" text-anchor="end">${label}</text>`;
    }).join("");
    const xTicks = [minX, (minX + maxX) / 2, maxX].map((value) => `<text class="axis-label" x="${x(value)}" y="${height - 22}" text-anchor="middle">${Math.round(value * 100)}</text>`).join("");
    const points = rows.map((row) => `<g><circle class="scatter-dot" cx="${x(row.uqi)}" cy="${y(row.hdi)}" r="6" fill="${colorFromScore(row.uqi, uqiPalette)}" data-name="${row.item.name}" data-uqi="${Math.round(row.uqi * 100)}" data-hdi="${row.hdi.toFixed(3)}"></circle><text class="scatter-label" x="${x(row.uqi)}" y="${y(row.hdi) - 10}">${shortName(row.item.name)}</text></g>`).join("");
    target.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img"><rect width="${width}" height="${height}" fill="#fff"></rect>${yTicks}<line class="axis" x1="${margin.left}" x2="${width - margin.right}" y1="${height - margin.bottom}" y2="${height - margin.bottom}"></line><line class="axis" x1="${margin.left}" x2="${margin.left}" y1="${margin.top}" y2="${height - margin.bottom}"></line>${xTicks}<line class="trend-line" x1="${x(minX)}" y1="${y(lineY1)}" x2="${x(maxX)}" y2="${y(lineY2)}"></line><text class="axis-label" x="${width / 2}" y="${height - 8}" text-anchor="middle">UQI score (${state.scatterYear})</text><text class="axis-label" x="15" y="${height / 2}" transform="rotate(-90 15 ${height / 2})" text-anchor="middle">HDI (${state.scatterYear})</text>${points}</svg>`;
    target.querySelectorAll(".scatter-dot").forEach((dot) => {
      dot.addEventListener("mousemove", (event) => showTooltip(event, `<strong>${dot.dataset.name}</strong>UQI: ${dot.dataset.uqi}/100<br>HDI: ${dot.dataset.hdi}`));
      dot.addEventListener("mouseleave", hideTooltip);
    });
  }

  function renderUqiLineChart() {
    const target = el("uqiLineChart");
    if (!target) return;
    const width = chartWidth;
    const height = chartHeight;
    const margin = { top: 28, right: 34, bottom: 58, left: 64 };
    const decades = state.data.decades;
    const lineColors = ["#2f5f47", "#b05b4b", "#5571b8", "#8a6bb0", "#c7953b", "#4b8a99", "#a35a78", "#6e7f4b", "#485b75", "#d07a42", "#6c5aa8", "#40876f", "#b34c4c", "#4774b5", "#8a6f38", "#5e7180", "#7a1f2b", "#5560a8", "#2d5a3d", "#8b6914"];
    const x = (index) => margin.left + index * ((width - margin.left - margin.right) / (decades.length - 1));
    const y = (score) => margin.top + (1 - score) * (height - margin.top - margin.bottom);
    const grid = [0, 0.25, 0.5, 0.75, 1].map((value) => `<line class="grid" x1="${margin.left}" x2="${width - margin.right}" y1="${y(value)}" y2="${y(value)}"></line><text class="axis-label" x="${margin.left - 10}" y="${y(value) + 4}" text-anchor="end">${Math.round(value * 100)}</text>`).join("");
    const xLabels = decades.map((decade, index) => index % 4 === 0 || index === decades.length - 1 ? `<text class="axis-label" x="${x(index)}" y="${height - 22}" text-anchor="middle">${decade}</text>` : "").join("");
    const lines = neighborhoods().map((item, itemIndex) => {
      const points = decades.map((decade, index) => {
        const score = scoreNeighborhood(item, decade);
        return score == null ? null : [x(index), y(score), score, decade];
      }).filter(Boolean);
      const d = points.map((point, index) => `${index === 0 ? "M" : "L"}${point[0].toFixed(2)},${point[1].toFixed(2)}`).join(" ");
      const last = points[points.length - 1];
      const label = last ? `<text class="line-label" x="${last[0] + 6}" y="${last[1] + 4}">${shortName(item.name)}</text>` : "";
      return `<path class="uqi-line" d="${d}" stroke="${lineColors[itemIndex % lineColors.length]}" data-name="${item.name}"></path>${label}`;
    }).join("");
    target.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img"><rect width="${width}" height="${height}" fill="#fff"></rect>${grid}<line class="axis" x1="${margin.left}" x2="${width - margin.right}" y1="${height - margin.bottom}" y2="${height - margin.bottom}"></line><line class="axis" x1="${margin.left}" x2="${margin.left}" y1="${margin.top}" y2="${height - margin.bottom}"></line>${xLabels}<text class="axis-label" x="${width / 2}" y="${height - 8}" text-anchor="middle">Decade</text><text class="axis-label" x="15" y="${height / 2}" transform="rotate(-90 15 ${height / 2})" text-anchor="middle">UQI score</text>${lines}</svg>`;
    target.querySelectorAll(".uqi-line").forEach((line) => {
      line.addEventListener("mousemove", (event) => showTooltip(event, `<strong>${line.dataset.name}</strong>UQI trajectory across all decades for the selected variables.`));
      line.addEventListener("mouseleave", hideTooltip);
    });
  }

  function showMapTooltip(event, mode, name, value) {
    showTooltip(event, `<strong>${name}</strong>${mode === "uqi" ? `${state.decade} UQI: ${value}/100` : `${state.hdiMapYear} HDI: ${value}`}`);
  }

  function showTooltip(event, html) {
    if (!tooltip) return;
    tooltip.innerHTML = html;
    tooltip.style.display = "block";
    tooltip.style.left = `${event.clientX + 14}px`;
    tooltip.style.top = `${event.clientY + 14}px`;
  }

  function hideTooltip() {
    if (tooltip) tooltip.style.display = "none";
  }

  function initRevealAndNav() {
    const revealItems = document.querySelectorAll(".reveal");
    const navLinks = document.querySelectorAll(".topbar a[href^='#']");
    const sections = [...navLinks].map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
    if (!("IntersectionObserver" in window)) revealItems.forEach((item) => item.classList.add("visible"));
    else {
      const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      }), { threshold: 0.12 });
      revealItems.forEach((item) => revealObserver.observe(item));
      const navObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
      }), { rootMargin: "-35% 0px -55% 0px", threshold: 0 });
      sections.forEach((section) => navObserver.observe(section));
    }
  }

  function setDecade(decade) {
    if (!state.data.decades.includes(decade)) return;
    state.decade = decade;
    renderAll();
  }

  function setSelectedVariables(keys) {
    state.selectedVariables = new Set(keys);
    renderAll();
  }

  function syncControlsFromState() {
    const controls = el("variableControls");
    if (controls) controls.querySelectorAll("input").forEach((input) => { input.checked = state.selectedVariables.has(input.value); });
    const decadeSlider = el("decadeSlider");
    if (decadeSlider) decadeSlider.value = state.data.decades.indexOf(state.decade);
  }

  return {
    state,
    boot,
    renderAll,
    setDecade,
    setSelectedVariables,
    syncControlsFromState,
    initControls,
    computeScores,
    scoreNeighborhood,
    renderMap,
    renderScatter,
    renderUqiLineChart,
    selectedVariables,
    matchSlug,
    featureName,
    shortName,
    colorFromScore,
    colorFromHdi,
    nearestHdiYear,
    stopDecadePlayback
  };
};
