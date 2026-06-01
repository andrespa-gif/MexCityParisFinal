/**
 * Neighborhood detail panel for UQI/HDI choropleth maps (SVG).
 * Exposes renderDetailPanel(featureName, ctx) and createMapDetailPanel(host).
 */
(function initNeighborhoodDetailPanel(global) {
  const PANEL_CSS = {
    bg: "#faf8f2",
    panel: "#fffdf8",
    card: "#ffffff",
    text: "#1e2522",
    muted: "#6f7772",
    line: "#e6e1d7",
    accent: "#2f5dcc",
    low: "#d95f59",
    mid: "#f1d36b",
    high: "#5aac72"
  };

  const UQI_RAMP = [PANEL_CSS.low, PANEL_CSS.mid, PANEL_CSS.high];

  function colorFromUqiScore(score01) {
    if (score01 == null || Number.isNaN(score01)) return PANEL_CSS.muted;
    const t = Math.max(0, Math.min(1, score01));
    if (t < 0.5) {
      const u = t / 0.5;
      return lerpColor(PANEL_CSS.low, PANEL_CSS.mid, u);
    }
    const u = (t - 0.5) / 0.5;
    return lerpColor(PANEL_CSS.mid, PANEL_CSS.high, u);
  }

  function lerpColor(a, b, t) {
    const pa = hexToRgb(a);
    const pb = hexToRgb(b);
    const r = Math.round(pa.r + (pb.r - pa.r) * t);
    const g = Math.round(pa.g + (pb.g - pa.g) * t);
    const bl = Math.round(pa.b + (pb.b - pa.b) * t);
    return `rgb(${r},${g},${bl})`;
  }

  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16)
    };
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function defaultVariables(ctx) {
    if (typeof ctx.defaultVariables === "function") return ctx.defaultVariables();
    return ctx.data.variables.filter((v) => v.defaultSelected);
  }

  function findNeighborhood(data, neighborhoodKey, featureName, matchSlug) {
    const slugKey = matchSlug(featureName);
    return (data[neighborhoodKey] || data.alcaldias || data.arrondissements || []).find(
      (item) => matchSlug(item.name) === slugKey
    );
  }

  function uqiScoresByDecade(item, ctx) {
    return ctx.data.decades.map((decade) => ({
      decade,
      score: ctx.scoreNeighborhood(item, decade)
    }));
  }

  function rankAtDecade(ctx, item, decade, field) {
    const hoods = ctx.neighborhoods();
    const rows = hoods.map((h) => {
      if (field === "uqi") {
        return { item: h, value: ctx.scoreNeighborhood(h, decade) };
      }
      const hdiYear = ctx.nearestHdiYear(decade) || decade;
      return { item: h, value: h.hdi?.[hdiYear] };
    }).filter((r) => typeof r.value === "number" && Number.isFinite(r.value));
    rows.sort((a, b) => b.value - a.value);
    const idx = rows.findIndex((r) => ctx.matchSlug(r.item.name) === ctx.matchSlug(item.name));
    return { rank: idx >= 0 ? idx + 1 : null, total: rows.length };
  }

  function cityMeanUqi(ctx, decade) {
    const scores = ctx.neighborhoods()
      .map((h) => ctx.scoreNeighborhood(h, decade))
      .filter((v) => typeof v === "number");
    if (!scores.length) return null;
    return scores.reduce((s, v) => s + v, 0) / scores.length;
  }

  function sparklineSvg(series, currentDecade, currentScore01) {
    const width = 248;
    const height = 48;
    const pad = 4;
    const innerW = width - pad * 2;
    const innerH = height - pad * 2;
    const valid = series.filter((p) => typeof p.score === "number");
    if (!valid.length) {
      return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true"></svg>`;
    }
    const points = series.map((p, i) => {
      const x = pad + (series.length <= 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
      const score = typeof p.score === "number" ? p.score : 0;
      const y = pad + innerH - score * innerH;
      return { x, y, decade: p.decade };
    });
    const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const stroke = colorFromUqiScore(currentScore01);
    const currentIdx = series.findIndex((p) => p.decade === currentDecade);
    const dot = currentIdx >= 0 && typeof series[currentIdx].score === "number"
      ? `<circle cx="${points[currentIdx].x.toFixed(1)}" cy="${points[currentIdx].y.toFixed(1)}" r="3.5" fill="${stroke}" stroke="#fff" stroke-width="1.5"></circle>`
      : "";
    return `<svg class="detail-sparkline" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true"><path d="${d}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>${dot}</svg>`;
  }

  function insightSentence(ctx, item, rankInfo, decade) {
    const name = item.name;
    const vars = defaultVariables(ctx);
    const normed = vars.map((variable) => {
      const raw = item.values?.[decade]?.[variable.key];
      const norm = ctx.normalize(raw, variable, decade);
      return { variable, norm: norm == null ? null : norm };
    }).filter((r) => r.norm != null);

    if (rankInfo.rank != null && rankInfo.rank <= 3) {
      return `${name} ranks ${rankInfo.rank} in the city — strong across transit, amenities, and services.`;
    }
    if (rankInfo.rank != null && rankInfo.total && rankInfo.rank >= rankInfo.total - 2) {
      const refDecade = ctx.data.decades.includes("1970") ? "1970" : ctx.data.decades[0];
      const hoodNow = ctx.scoreNeighborhood(item, decade);
      const hoodThen = ctx.scoreNeighborhood(item, refDecade);
      const meanNow = cityMeanUqi(ctx, decade);
      const meanThen = cityMeanUqi(ctx, refDecade);
      let trend = "held";
      if (hoodNow != null && hoodThen != null && meanNow != null && meanThen != null) {
        const hoodDelta = hoodNow - hoodThen;
        const meanDelta = meanNow - meanThen;
        if (hoodDelta > meanDelta + 0.03) trend = "narrowed";
        else if (hoodDelta < meanDelta - 0.03) trend = "widened";
      }
      return `${name} ranks ${rankInfo.rank} — the gap to the city average has ${trend} since ${refDecade}.`;
    }
    if (normed.length >= 2) {
      const sorted = [...normed].sort((a, b) => b.norm - a.norm);
      const strongest = sorted[0].variable.label;
      const weakest = sorted[sorted.length - 1].variable.label;
      return `${name} leads the city on ${strongest} but ranks near the bottom on ${weakest}.`;
    }
    return `${name} at decade ${decade}.`;
  }

  function renderDetailPanel(panelEl, featureName, ctx) {
    const item = findNeighborhood(ctx.data, ctx.neighborhoodKey, featureName, ctx.matchSlug);
    if (!item) return;

    const decade = ctx.decade;
    const uqiScore = ctx.scoreNeighborhood(item, decade);
    const uqi100 = uqiScore == null ? null : Math.round(uqiScore * 100);
    const mean = cityMeanUqi(ctx, decade);
    const diff = uqiScore != null && mean != null ? Math.round(uqi100 - mean * 100) : null;
    const rankInfo = rankAtDecade(ctx, item, decade, "uqi");

    const hdiYear = ctx.nearestHdiYear(decade);
    const hdiVal = hdiYear ? item.hdi?.[hdiYear] : null;
    const hdiRank = typeof hdiVal === "number" ? rankAtDecade(ctx, item, decade, "hdi") : null;

    const series = uqiScoresByDecade(item, ctx).map((p) => ({
      decade: p.decade,
      score: p.score
    }));

    const vars = defaultVariables(ctx);
    const varRows = vars.map((variable) => {
      const raw = item.values?.[decade]?.[variable.key];
      const norm = ctx.normalize(raw, variable, decade);
      const pct = norm == null ? 0 : Math.round(norm * 100);
      return `
        <div class="detail-var-row">
          <span class="detail-var-label">${escapeHtml(variable.label)}</span>
          <div class="detail-var-bar-track"><div class="detail-var-bar-fill" style="width:${pct}%"></div></div>
          <span class="detail-var-value">${pct}</span>
        </div>`;
    }).join("");

    const diffClass = diff == null ? "" : diff >= 0 ? "pos" : "neg";
    const diffText = diff == null ? "—" : `${diff >= 0 ? "+" : ""}${diff}`;

    let hdiBlock = `<p class="detail-muted">HDI not available for this decade</p>`;
    if (typeof hdiVal === "number" && hdiRank?.rank) {
      hdiBlock = `
        <div class="detail-score-row detail-score-row-secondary">
          <div class="detail-stat">
            <span class="detail-stat-label">HDI</span>
            <span class="detail-stat-value">${hdiVal.toFixed(3)}</span>
          </div>
          <div class="detail-stat">
            <span class="detail-stat-label">HDI rank</span>
            <span class="detail-stat-value">Rank ${hdiRank.rank} of ${hdiRank.total}</span>
          </div>
        </div>`;
    }

    panelEl.innerHTML = `
      <button type="button" class="detail-panel-close" aria-label="Close">×</button>
      <h3 class="detail-panel-name">${escapeHtml(item.name)}</h3>
      <p class="detail-panel-city">${escapeHtml(ctx.cityName)}</p>
      ${sparklineSvg(series, decade, uqiScore)}
      <div class="detail-score-row">
        <div class="detail-stat">
          <span class="detail-stat-label">UQI ${escapeHtml(decade)}</span>
          <span class="detail-stat-value detail-uqi-value" style="color:${colorFromUqiScore(uqiScore)}">${uqi100 ?? "—"}</span>
        </div>
        <div class="detail-stat">
          <span class="detail-stat-label">vs. city mean</span>
          <span class="detail-stat-value ${diffClass}">${diffText}</span>
        </div>
        <div class="detail-stat">
          <span class="detail-stat-label">UQI rank</span>
          <span class="detail-stat-value">${rankInfo.rank ? `Rank ${rankInfo.rank} of ${rankInfo.total}` : "—"}</span>
        </div>
      </div>
      ${hdiBlock}
      <h4 class="detail-section-title">Variable breakdown</h4>
      <div class="detail-var-list">${varRows}</div>
      <p class="detail-insight">${escapeHtml(insightSentence(ctx, item, rankInfo, decade))}</p>
    `;

    const closeBtn = panelEl.querySelector(".detail-panel-close");
    if (closeBtn) {
      closeBtn.onclick = (event) => {
        event.stopPropagation();
        panelEl._controller?.close();
      };
    }
  }

  function renderDetailPanelFromData(featureName, cityData, hdiData, currentDecade, panelEl, helpers) {
    const ctx = {
      data: cityData,
      decade: currentDecade,
      hdiData,
      cityName: helpers?.cityName || cityData.title || "",
      neighborhoodKey: helpers?.neighborhoodKey || "alcaldias",
      matchSlug: helpers?.matchSlug,
      normalize: helpers?.normalize,
      scoreNeighborhood: helpers?.scoreNeighborhood,
      neighborhoods: helpers?.neighborhoods,
      nearestHdiYear: helpers?.nearestHdiYear,
      defaultVariables: helpers?.defaultVariables
    };
    renderDetailPanel(panelEl, featureName, ctx);
  }

  function createMapDetailPanel(hostElement) {
    if (!hostElement) return null;
    hostElement.classList.add("map-detail-host");

    let panel = hostElement.querySelector("#detail-panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "detail-panel";
      panel.className = "detail-panel";
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-label", "Neighborhood detail");
      panel.setAttribute("aria-hidden", "true");
      hostElement.appendChild(panel);
    }

    const controller = {
      host: hostElement,
      panel,
      ctx: null,
      openSlug: null,
      mapKey: null,
      escapeHandler: null,

      open(featureName, ctx) {
        const slug = ctx.matchSlug(featureName);
        this.ctx = ctx;
        this.openSlug = slug;
        renderDetailPanel(this.panel, featureName, ctx);
        this.panel.classList.add("open");
        this.panel.setAttribute("aria-hidden", "false");
        if (!global.__detailPanelEscapeHandler) {
          global.__detailPanelEscapeHandler = (event) => {
            if (event.key !== "Escape") return;
            document.querySelectorAll(".detail-panel.open").forEach((node) => node._controller?.close());
          };
          document.addEventListener("keydown", global.__detailPanelEscapeHandler);
        }
      },

      close() {
        this.openSlug = null;
        this.panel.classList.remove("open");
        this.panel.setAttribute("aria-hidden", "true");
        this.host?.querySelectorAll(".alcaldia-path.selected").forEach((path) => path.classList.remove("selected"));
      },

      refreshIfOpen() {
        if (!this.openSlug || !this.ctx) return;
        const hood = this.ctx.neighborhoods().find((h) => this.ctx.matchSlug(h.name) === this.openSlug);
        if (hood) renderDetailPanel(this.panel, hood.name, this.ctx);
        else this.close();
      },

      bindMap(mapRoot, mapKey, ctx) {
        this.mapKey = mapKey;
        this.ctx = ctx;

        const bg = mapRoot.querySelector("rect");
        if (bg) {
          bg.style.cursor = "default";
          bg.onclick = (event) => {
            event.stopPropagation();
            this.close();
          };
        }

        mapRoot.querySelectorAll(".alcaldia-path").forEach((path) => {
          path.style.cursor = "pointer";
          path.onclick = (event) => {
            event.stopPropagation();
            const name = path.dataset.name;
            if (!name) return;
            mapRoot.querySelectorAll(".alcaldia-path").forEach((p) => p.classList.remove("selected"));
            const slug = ctx.matchSlug(name);
            if (this.openSlug === slug) {
              this.close();
              return;
            }
            path.classList.add("selected");
            this.open(name, ctx);
          };
        });
      }
    };

    panel._controller = controller;
    return controller;
  }

  global.renderDetailPanel = renderDetailPanelFromData;
  global.renderDetailPanelInPlace = renderDetailPanel;
  global.createMapDetailPanel = createMapDetailPanel;
  global.NeighborhoodDetailPanelColors = PANEL_CSS;
})(window);
