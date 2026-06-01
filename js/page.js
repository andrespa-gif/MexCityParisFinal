const UQI_DECADES = ["1870", "1880", "1890", "1900", "1910", "1920", "1930", "1940", "1950", "1960", "1970", "1980", "1990", "2000", "2010", "2020"];
const HDI_YEAR = "2020";

const VARIABLE_HELP = {
  transit_access: "Counts weighted transit station-equivalents per 100,000 residents. Metro receives the highest weight because of capacity and dedicated right of way. Measures whether planners built mobility where people live.",
  electricity: "Share of inhabited dwellings with electricity service. Historical decades show when each neighborhood was connected to the grid. Near-universal coverage today hides a century of staggered access.",
  piped_water: "Share of dwellings with piped water inside the unit or building. A direct measure of whether the state extended basic services to peripheral districts on the same timeline as the center.",
  drainage: "Share of dwellings connected to sewer or drainage networks. Haussmann's sewers reached central Paris first; eastern arrondissements and peripheral alcaldías were connected decades later.",
  hospital_access: "Major hospitals per 100,000 residents. Counts hospital-level institutions, not clinics. Proxies whether planning concentrated health infrastructure in particular districts.",
  green_space: "Public green space in square meters per resident. Uses current park inventories divided by historical population, showing how amenity pressure changed as neighborhoods grew.",
  third_spaces: "Museums and public libraries per 100,000 residents. Civic and cultural infrastructure that the state chose to locate. A proxy for non-commercial public space."
};

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

  const variables = pageState.cdmxData.variables.filter((v) => v.defaultSelected || VARIABLE_HELP[v.key]);
  variables.filter((v) => v.defaultSelected).forEach((v) => pageState.selectedVariables.add(v.key));
  const controls = document.getElementById("uqiVariableControls");
  const drawer = document.getElementById("varDetailDrawer");
  const drawerTitle = document.getElementById("varDrawerTitle");
  const drawerBody = document.getElementById("varDrawerBody");
  const drawerClose = document.getElementById("varDrawerClose");

  controls.innerHTML = variables.map((variable) => `
    <label class="var-chip">
      <input type="checkbox" value="${variable.key}" ${pageState.selectedVariables.has(variable.key) ? "checked" : ""}>
      <span class="var-name-btn" role="button" tabindex="0" data-key="${variable.key}" data-label="${variable.label}">${variable.label}</span>
    </label>
  `).join("");

  function openDrawer(key, label) {
    const help = VARIABLE_HELP[key] || pageState.cdmxData.variables.find((v) => v.key === key)?.description || "";
    drawerTitle.textContent = label;
    drawerBody.textContent = help;
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
    const defaults = pageState.cdmxData.variables.filter((v) => v.defaultSelected).map((v) => v.key);
    pageState.selectedVariables = new Set(defaults);
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
  renderUqiMaps();
  renderHdiSection();
  renderLineCharts();
}).catch((error) => {
  console.error(error);
  document.body.insertAdjacentHTML("afterbegin", `<div class="load-error">Could not load map data: ${error.message}</div>`);
});
