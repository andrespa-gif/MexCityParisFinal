const UQI_DECADES = ["1870", "1880", "1890", "1900", "1910", "1920", "1930", "1940", "1950", "1960", "1970", "1980", "1990", "2000", "2010", "2020"];
const HDI_YEAR = "2020";

const VARIABLE_SPEC = {
  transit_access: {
    help: "Mobility infrastructure the state chose to build. Paris: cumulative métro stations per km² of fixed arrondissement area (immune to depopulation). CDMX: weighted station-equivalents per 100,000 residents (Metro = 1.0 capacity benchmark).",
    latex: String.raw`x^{\mathrm{transit}}_{i,t} = \begin{cases} S_{i,t} / A_i & \text{(Paris: stations per km}^2\text{)} \\[6pt] w \cdot N^{\mathrm{st}}_{i,t} / P_{i,t} & \text{(CDMX: weighted per 100k)} \end{cases}`
  },
  electricity: {
    help: "Share of inhabited dwellings with electricity. Historical decades reveal staggered grid connection; near-universal coverage today masks century-long inequality in timing.",
    latex: String.raw`x^{\mathrm{elec}}_{i,t} = \frac{D^{\mathrm{elec}}_{i,t}}{D_{i,t}} \in [0,1]`
  },
  piped_water: {
    help: "Share of dwellings with piped water inside the unit. In 2020, peripheral alcaldías such as Iztapalapa remain far below universal coverage.",
    latex: String.raw`x^{\mathrm{water}}_{i,t} = \frac{D^{\mathrm{water}}_{i,t}}{D_{i,t}} \in [0,1]`
  },
  drainage: {
    help: "Share of dwellings connected to sewer or drainage. Haussmann sewers reached central Paris first; eastern arrondissements and peripheral districts followed decades later.",
    latex: String.raw`x^{\mathrm{drain}}_{i,t} = \frac{D^{\mathrm{drain}}_{i,t}}{D_{i,t}} \in [0,1]`
  },
  hospital_access: {
    help: "Major hospital-level institutions per 100,000 residents (clinics excluded). Proxies where the state concentrated health infrastructure.",
    latex: String.raw`x^{\mathrm{hosp}}_{i,t} = \frac{H_{i,t}}{P_{i,t}} \times 10^{5}`
  },
  green_space: {
    help: "Public park and garden area per resident. Current green-space inventory divided by historical population — a pressure indicator as neighborhoods grow.",
    latex: String.raw`x^{\mathrm{green}}_{i,t} = \frac{A^{\mathrm{parks}}_{i}}{P_{i,t}} \quad (\mathrm{m}^2/\mathrm{resident})`
  },
  third_spaces: {
    help: "Museums and public libraries per 100,000 residents, cumulative by documented opening date. Civic infrastructure the state chose to locate.",
    latex: String.raw`x^{\mathrm{3rd}}_{i,t} = \frac{L_{i,t} + M_{i,t}}{P_{i,t}} \times 10^{5}`
  },
  persons_per_dwelling: {
    help: "Average household size (persons per dwelling). Lower is better — a crowding proxy for housing quality and space. Used in the Paris five-variable composite.",
    latex: String.raw`x^{\mathrm{crowd}}_{i,t} = \frac{P_{i,t}}{D_{i,t}} \quad (\text{lower is better})`
  }
};

const INDEX_LATEX = String.raw`
n_{i,t,v} = \frac{x_{i,t,v} - \min_{j} x_{j,t,v}}{\max_{j} x_{j,t,v} - \min_{j} x_{j,t,v}}, \qquad
n'_{i,t,v} = \begin{cases} n_{i,t,v} & \text{if higher is better} \\ 1 - n_{i,t,v} & \text{otherwise} \end{cases}
`;
const UQI_LATEX = String.raw`\mathrm{UQI}_{i,t} = 100 \cdot \frac{1}{|V_t|}\sum_{v \in V_t} n'_{i,t,v}`;

const pageState = {
  uqiDecade: "2020",
  lineDecade: "2020",
  selectedVariables: new Set(),
  uqiPlayTimer: null,
  linePlayTimer: null,
  parisLab: null,
  cdmxLab: null,
  parisData: null,
  cdmxData: null
};

function nearestDecade(data, decade) {
  if (data.decades.includes(decade)) return decade;
  const target = Number(decade);
  return data.decades.reduce((best, year) => Math.abs(Number(year) - target) < Math.abs(Number(best) - target) ? year : best, data.decades[0]);
}

function renderUqiMaps() {
  pageState.parisLab.state.decade = nearestDecade(pageState.parisData, pageState.uqiDecade);
  pageState.cdmxLab.state.decade = nearestDecade(pageState.cdmxData, pageState.uqiDecade);
  pageState.parisLab.state.selectedVariables = new Set(pageState.selectedVariables);
  pageState.cdmxLab.state.selectedVariables = new Set(pageState.selectedVariables);
  document.getElementById("parisUqiMapLabel").textContent = pageState.parisLab.state.decade;
  document.getElementById("cdmxUqiMapLabel").textContent = pageState.cdmxLab.state.decade;
  pageState.parisLab.renderAll({ uqi: true, hdi: false, scatter: false, line: false });
  pageState.cdmxLab.renderAll({ uqi: true, hdi: false, scatter: false, line: false });
}

function renderHdiSection() {
  pageState.parisLab.state.hdiMapYear = HDI_YEAR;
  pageState.cdmxLab.state.hdiMapYear = HDI_YEAR;
  pageState.parisLab.state.scatterYear = HDI_YEAR;
  pageState.cdmxLab.state.scatterYear = HDI_YEAR;
  pageState.parisLab.state.decade = nearestDecade(pageState.parisData, HDI_YEAR);
  pageState.cdmxLab.state.decade = nearestDecade(pageState.cdmxData, HDI_YEAR);
  pageState.parisLab.state.selectedVariables = new Set(pageState.selectedVariables);
  pageState.cdmxLab.state.selectedVariables = new Set(pageState.selectedVariables);
  pageState.parisLab.renderAll({ uqi: false, hdi: true, scatter: true, line: false, keepScatterYear: true });
  pageState.cdmxLab.renderAll({ uqi: false, hdi: true, scatter: true, line: false, keepScatterYear: true });
  updateRegressionStats();
}

function renderLineCharts() {
  pageState.parisLab.state.selectedVariables = new Set(pageState.selectedVariables);
  pageState.cdmxLab.state.selectedVariables = new Set(pageState.selectedVariables);
  const parisRef = nearestDecade(pageState.parisData, pageState.lineDecade);
  const cdmxRef = nearestDecade(pageState.cdmxData, pageState.lineDecade);
  pageState.parisLab.setReferenceDecade(parisRef);
  pageState.cdmxLab.setReferenceDecade(cdmxRef);
  pageState.parisLab.renderAll({ uqi: false, hdi: false, scatter: false, line: true });
  pageState.cdmxLab.renderAll({ uqi: false, hdi: false, scatter: false, line: true });
  document.getElementById("lineDecadeLabel").textContent = pageState.lineDecade;
}

function regressionStats(lab) {
  const rows = lab.scatterRows ? lab.scatterRows() : [];
  if (!rows.length) return { r2: 0, n: 0, slope: 0 };
  const meanX = rows.reduce((s, r) => s + r.uqi, 0) / rows.length;
  const meanY = rows.reduce((s, r) => s + r.hdi, 0) / rows.length;
  const ssXY = rows.reduce((s, r) => s + (r.uqi - meanX) * (r.hdi - meanY), 0);
  const ssXX = rows.reduce((s, r) => s + (r.uqi - meanX) ** 2, 0);
  const ssTot = rows.reduce((s, r) => s + (r.hdi - meanY) ** 2, 0);
  const slope = ssXX ? ssXY / ssXX : 0;
  const intercept = meanY - slope * meanX;
  const ssRes = rows.reduce((s, r) => s + (r.hdi - (intercept + slope * r.uqi)) ** 2, 0);
  return { r2: ssTot ? 1 - ssRes / ssTot : 0, n: rows.length, slope };
}

function mergeVariableCatalog() {
  const byKey = new Map();
  [...pageState.parisData.variables, ...pageState.cdmxData.variables].forEach((variable) => {
    if (!byKey.has(variable.key)) byKey.set(variable.key, { ...variable });
    else {
      const existing = byKey.get(variable.key);
      existing.defaultSelected = existing.defaultSelected || variable.defaultSelected;
      if (!existing.description && variable.description) existing.description = variable.description;
    }
  });
  return [...byKey.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function defaultVariableKeys() {
  const keys = new Set();
  pageState.parisData.variables.filter((v) => v.defaultSelected).forEach((v) => keys.add(v.key));
  pageState.cdmxData.variables.filter((v) => v.defaultSelected).forEach((v) => keys.add(v.key));
  return [...keys];
}

function renderKatex(target, latex, displayMode = true) {
  if (!target || typeof katex === "undefined") {
    target.textContent = "";
    return;
  }
  try {
    katex.render(latex, target, { throwOnError: false, displayMode });
  } catch {
    target.textContent = "";
  }
}

function formatRawValue(key, value) {
  if (value == null || Number.isNaN(value)) return "—";
  if (key === "electricity" || key === "piped_water" || key === "drainage") return `${value.toFixed(1)}%`;
  if (key === "green_space") return value.toFixed(1);
  if (key === "transit_access" && value < 20) return value.toFixed(2);
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function openCityDataModal(city) {
  const lab = city === "paris" ? pageState.parisLab : pageState.cdmxLab;
  const data = city === "paris" ? pageState.parisData : pageState.cdmxData;
  const decade = lab.state.decade;
  const modal = document.getElementById("cityDataModal");
  const title = document.getElementById("cityDataTitle");
  const meta = document.getElementById("cityDataMeta");
  const table = document.getElementById("cityDataTable");
  const unitLabel = city === "paris" ? "arrondissement" : "alcaldía";
  const vars = mergeVariableCatalog().filter((v) => pageState.selectedVariables.has(v.key));
  const rows = (data.arrondissements || data.alcaldias || []).map((item) => {
    const score = lab.state.scores.get(lab.matchSlug(item.name));
    return { item, score: score?.score };
  }).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  title.textContent = city === "paris" ? "Paris · compiled UQI data" : "CDMX · compiled UQI data";
  meta.textContent = `Decade ${decade} · ${rows.length} ${unitLabel}s · raw components and normalized UQI (0–100) for selected variables`;

  const head = `<thead><tr><th>${unitLabel}</th><th>UQI</th>${vars.map((v) => `<th>${v.label}</th>`).join("")}</tr></thead>`;
  const body = rows.map(({ item, score }) => {
    const cells = vars.map((variable) => {
      const raw = item.values?.[decade]?.[variable.key];
      const norm = lab.normalize(raw, variable, decade);
      const normText = norm == null ? "—" : Math.round(norm * 100);
      return `<td><span class="raw-val">${formatRawValue(variable.key, raw)}</span><span class="norm-val">${normText}</span></td>`;
    }).join("");
    return `<tr><th scope="row">${item.name}</th><td class="uqi-cell">${score == null ? "—" : Math.round(score * 100)}</td>${cells}</tr>`;
  }).join("");

  table.innerHTML = head + `<tbody>${body}</tbody>`;
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeCityDataModal() {
  const modal = document.getElementById("cityDataModal");
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function initCityDataPanels() {
  const bind = (id, city) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const open = () => openCityDataModal(city);
    btn.addEventListener("click", open);
    btn.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  };
  bind("parisUqiDataBtn", "paris");
  bind("cdmxUqiDataBtn", "cdmx");
  document.getElementById("cityDataClose")?.addEventListener("click", closeCityDataModal);
  document.getElementById("cityDataBackdrop")?.addEventListener("click", closeCityDataModal);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCityDataModal();
  });
}

function updateRegressionStats() {
  const paris = regressionStats(pageState.parisLab);
  const cdmx = regressionStats(pageState.cdmxLab);
  const el = document.getElementById("regression-stats");
  if (el) {
    el.innerHTML = `
      <p><strong>Paris (2020):</strong> n = ${paris.n} arrondissements · R² = ${paris.r2.toFixed(3)} · slope = ${paris.slope.toFixed(3)}</p>
      <p><strong>Mexico City (2020):</strong> n = ${cdmx.n} alcaldías · R² = ${cdmx.r2.toFixed(3)} · slope = ${cdmx.slope.toFixed(3)}</p>
    `;
  }
}

function initUqiToolbar() {
  const slider = document.getElementById("uqiDecadeSlider");
  const label = document.getElementById("uqiDecadeLabel");
  const ticks = document.getElementById("uqiDecadeTicks");
  slider.max = UQI_DECADES.length - 1;
  slider.value = UQI_DECADES.indexOf(pageState.uqiDecade);
  label.textContent = pageState.uqiDecade;
  ticks.innerHTML = UQI_DECADES.map((d, i) => i % 4 === 0 || i === UQI_DECADES.length - 1 ? `<span>${d}</span>` : "<span></span>").join("");
  slider.addEventListener("input", () => {
    pageState.uqiDecade = UQI_DECADES[Number(slider.value)];
    label.textContent = pageState.uqiDecade;
    stopUqiPlay();
    renderUqiMaps();
  });
  document.getElementById("uqiPlay").addEventListener("click", () => {
    if (pageState.uqiPlayTimer) stopUqiPlay();
    else startUqiPlay();
  });

  const variables = mergeVariableCatalog().filter((v) => v.defaultSelected || VARIABLE_SPEC[v.key]);
  defaultVariableKeys().forEach((key) => pageState.selectedVariables.add(key));
  const controls = document.getElementById("uqiVariableControls");
  const drawer = document.getElementById("varDetailDrawer");
  const drawerTitle = document.getElementById("varDrawerTitle");
  const drawerBody = document.getElementById("varDrawerBody");
  const drawerMath = document.getElementById("varDrawerMath");
  const drawerClose = document.getElementById("varDrawerClose");

  controls.innerHTML = variables.map((variable) => `
    <label class="var-chip">
      <input type="checkbox" value="${variable.key}" ${pageState.selectedVariables.has(variable.key) ? "checked" : ""}>
      <span class="var-name-btn" role="button" tabindex="0" data-key="${variable.key}" data-label="${variable.label}">${variable.label}</span>
    </label>
  `).join("");

  function openDrawer(key, label) {
    const spec = VARIABLE_SPEC[key];
    const fromData = pageState.parisData.variables.find((v) => v.key === key)
      || pageState.cdmxData.variables.find((v) => v.key === key);
    drawerTitle.textContent = label;
    drawerBody.textContent = spec?.help || fromData?.description || "";
    drawerMath.innerHTML = "";
    const block = document.createElement("div");
    block.className = "var-math-block";
    if (spec?.latex) {
      const rawLabel = document.createElement("p");
      rawLabel.className = "var-math-label";
      rawLabel.textContent = "Raw measure";
      const raw = document.createElement("div");
      raw.className = "var-math-raw";
      block.appendChild(rawLabel);
      block.appendChild(raw);
      renderKatex(raw, spec.latex, true);
    }
    const normLabel = document.createElement("p");
    normLabel.className = "var-math-label";
    normLabel.textContent = "Normalization & composite (within city, within decade)";
    const norm = document.createElement("div");
    norm.className = "var-math-norm";
    block.appendChild(normLabel);
    block.appendChild(norm);
    renderKatex(norm, INDEX_LATEX + "\\\\[8pt]" + UQI_LATEX, true);
    const note = document.createElement("p");
    note.className = "var-math-note";
    note.textContent = "Min-max here is cross-sectional affine rescaling — not a global ranking across cities or time. That keeps Paris-vs-CDMX separate from 7e-vs-19e.";
    block.appendChild(note);
    drawerMath.appendChild(block);
    drawer.classList.add("open");
    controls.querySelectorAll(".var-name-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.key === key);
    });
  }

  function closeDrawer() {
    drawer.classList.remove("open");
    controls.querySelectorAll(".var-name-btn").forEach((btn) => btn.classList.remove("active"));
  }

  controls.addEventListener("change", (event) => {
    if (!event.target.matches("input[type='checkbox']")) return;
    if (event.target.checked) pageState.selectedVariables.add(event.target.value);
    else pageState.selectedVariables.delete(event.target.value);
    renderUqiMaps();
    renderHdiSection();
    renderLineCharts();
  });

  controls.addEventListener("click", (event) => {
    const nameBtn = event.target.closest(".var-name-btn");
    if (!nameBtn) return;
    event.preventDefault();
    event.stopPropagation();
    const isOpen = drawer.classList.contains("open") && nameBtn.classList.contains("active");
    if (isOpen) closeDrawer();
    else openDrawer(nameBtn.dataset.key, nameBtn.dataset.label);
  });

  controls.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const nameBtn = event.target.closest(".var-name-btn");
    if (!nameBtn) return;
    event.preventDefault();
    const isOpen = drawer.classList.contains("open") && nameBtn.classList.contains("active");
    if (isOpen) closeDrawer();
    else openDrawer(nameBtn.dataset.key, nameBtn.dataset.label);
  });

  drawerClose?.addEventListener("click", closeDrawer);

  document.getElementById("uqiReset").addEventListener("click", (event) => {
    event.preventDefault();
    pageState.selectedVariables = new Set(defaultVariableKeys());
    controls.querySelectorAll("input").forEach((input) => { input.checked = pageState.selectedVariables.has(input.value); });
    renderUqiMaps();
    renderHdiSection();
    renderLineCharts();
  });
}

function startUqiPlay() {
  document.getElementById("uqiPlay").textContent = "Pause";
  pageState.uqiPlayTimer = window.setInterval(() => {
    const i = UQI_DECADES.indexOf(pageState.uqiDecade);
    const next = i >= UQI_DECADES.length - 1 ? 0 : i + 1;
    pageState.uqiDecade = UQI_DECADES[next];
    document.getElementById("uqiDecadeSlider").value = next;
    document.getElementById("uqiDecadeLabel").textContent = pageState.uqiDecade;
    renderUqiMaps();
  }, 1500);
}

function stopUqiPlay() {
  if (pageState.uqiPlayTimer) window.clearInterval(pageState.uqiPlayTimer);
  pageState.uqiPlayTimer = null;
  document.getElementById("uqiPlay").textContent = "Play";
}

function initLineToolbar() {
  const slider = document.getElementById("lineDecadeSlider");
  const label = document.getElementById("lineDecadeLabel");
  slider.max = UQI_DECADES.length - 1;
  slider.value = UQI_DECADES.indexOf(pageState.lineDecade);
  label.textContent = pageState.lineDecade;
  slider.addEventListener("input", () => {
    pageState.lineDecade = UQI_DECADES[Number(slider.value)];
    label.textContent = pageState.lineDecade;
    stopLinePlay();
    renderLineCharts();
  });
  document.getElementById("linePlay").addEventListener("click", () => {
    if (pageState.linePlayTimer) stopLinePlay();
    else startLinePlay();
  });
}

function startLinePlay() {
  document.getElementById("linePlay").textContent = "Pause";
  pageState.linePlayTimer = window.setInterval(() => {
    const i = UQI_DECADES.indexOf(pageState.lineDecade);
    const next = i >= UQI_DECADES.length - 1 ? 0 : i + 1;
    pageState.lineDecade = UQI_DECADES[next];
    document.getElementById("lineDecadeSlider").value = next;
    document.getElementById("lineDecadeLabel").textContent = pageState.lineDecade;
    renderLineCharts();
  }, 1500);
}

function stopLinePlay() {
  if (pageState.linePlayTimer) window.clearInterval(pageState.linePlayTimer);
  pageState.linePlayTimer = null;
  document.getElementById("linePlay").textContent = "Play";
}

Promise.all([
  fetch("data/paris/uqi-by-arrondissement.json").then((r) => r.json()),
  fetch("data/paris/arrondissements.geojson").then((r) => r.json()),
  fetch("data/cdmx/uqi-by-alcaldia.json").then((r) => r.json()).catch(() => fetch("data/cdmx/urban-index-data.json").then((r) => r.json())),
  fetch("data/cdmx/alcaldias.geojson").then((r) => r.json())
]).then(([parisData, parisBoundaries, cdmxData, cdmxBoundaries]) => {
  pageState.parisData = parisData;
  pageState.cdmxData = cdmxData;

  pageState.parisLab = window.createCityLab({
    neighborhoodKey: "arrondissements",
    cityName: "Paris",
    manageControls: false,
    initNav: false,
    mapWidth: 480,
    mapHeight: 400,
    hdiMapHeight: 400,
    chartWidth: 480,
    chartHeight: 360,
    dotColor: "#7a1f2b",
    shortName: (name) => name.replace(" — ", " ").replace("Hôtel-de-Ville", "Hôtel-V.").replace("Buttes-Montmartre", "Montmartre").replace("Buttes-Chaumont", "Chaumont"),
    featureName: (feature) => feature.properties?.name || feature.properties?.l_aroff || "",
    elements: { uqiMap: "parisUqiMap", hdiMap: "parisHdiMap", scatterPlot: "parisScatterPlot", uqiLineChart: "parisUqiLineChart" }
  });

  pageState.cdmxLab = window.createCityLab({
    neighborhoodKey: "alcaldias",
    cityName: "Mexico City",
    manageControls: false,
    initNav: false,
    mapWidth: 480,
    mapHeight: 400,
    hdiMapHeight: 400,
    chartWidth: 480,
    chartHeight: 360,
    dotColor: "#2d5a3d",
    aliases: new Map([["magdalena_contreras", "la_magdalena_contreras"], ["cuajimalpa", "cuajimalpa_de_morelos"]]),
    shortName: (name) => name.replace("La Magdalena Contreras", "Magdalena C.").replace("Gustavo A. Madero", "G.A. Madero").replace("Venustiano Carranza", "V. Carranza").replace("Cuajimalpa de Morelos", "Cuajimalpa"),
    featureName: (feature) => feature.properties?.alcaldia || feature.properties?.NOMGEO || "",
    elements: { uqiMap: "cdmxUqiMap", hdiMap: "cdmxHdiMap", scatterPlot: "cdmxScatterPlot", uqiLineChart: "cdmxUqiLineChart" }
  });

  pageState.parisLab.boot(parisData, parisBoundaries);
  pageState.cdmxLab.boot(cdmxData, cdmxBoundaries);

  initUqiToolbar();
  initLineToolbar();
  initCityDataPanels();
  renderUqiMaps();
  renderHdiSection();
  renderLineCharts();
}).catch((error) => {
  console.error(error);
  document.body.insertAdjacentHTML("afterbegin", `<div class="load-error">Could not load map data: ${error.message}</div>`);
});
