const SHARED_DECADES = ["1870", "1880", "1890", "1900", "1910", "1920", "1930", "1940", "1950", "1960", "1970", "1980", "1990", "2000", "2010", "2020"];

const compareState = {
  decade: "2020",
  selectedVariables: new Set(),
  playTimer: null,
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

function renderCompare() {
  compareState.parisLab.state.decade = nearestDecade(compareState.parisData, compareState.decade);
  compareState.cdmxLab.state.decade = nearestDecade(compareState.cdmxData, compareState.decade);
  compareState.parisLab.state.selectedVariables = new Set(compareState.selectedVariables);
  compareState.cdmxLab.state.selectedVariables = new Set(compareState.selectedVariables);

  document.getElementById("decadeLabel").textContent = compareState.decade;
  document.getElementById("decadeSlider").value = SHARED_DECADES.indexOf(compareState.decade);

  document.getElementById("parisUqiMapLabel").textContent = compareState.parisLab.state.decade;
  document.getElementById("cdmxUqiMapLabel").textContent = compareState.cdmxLab.state.decade;

  const parisHdiYear = compareState.parisLab.nearestHdiYear(compareState.parisLab.state.decade) || "2020";
  const cdmxHdiYear = compareState.cdmxLab.nearestHdiYear(compareState.cdmxLab.state.decade) || "2020";
  compareState.parisLab.state.hdiMapYear = parisHdiYear;
  compareState.parisLab.state.scatterYear = parisHdiYear;
  compareState.cdmxLab.state.hdiMapYear = cdmxHdiYear;
  compareState.cdmxLab.state.scatterYear = cdmxHdiYear;

  document.getElementById("parisHdiMapLabel").textContent = parisHdiYear;
  document.getElementById("cdmxHdiMapLabel").textContent = cdmxHdiYear;
  document.getElementById("parisScatterLabel").textContent = parisHdiYear;
  document.getElementById("cdmxScatterLabel").textContent = cdmxHdiYear;

  compareState.parisLab.renderAll();
  compareState.cdmxLab.renderAll();
}

function initSharedControls() {
  const decadeSlider = document.getElementById("decadeSlider");
  decadeSlider.max = SHARED_DECADES.length - 1;
  decadeSlider.value = SHARED_DECADES.indexOf(compareState.decade);
  document.getElementById("decadeTicks").innerHTML = SHARED_DECADES.map((decade, index) => index % 4 === 0 || index === SHARED_DECADES.length - 1 ? `<span>${decade}</span>` : "<span></span>").join("");

  decadeSlider.addEventListener("input", (event) => {
    compareState.decade = SHARED_DECADES[Number(event.target.value)];
    stopPlayback();
    renderCompare();
  });

  document.getElementById("playDecades").addEventListener("click", () => {
    if (compareState.playTimer) stopPlayback();
    else startPlayback();
  });

  const variables = compareState.cdmxData.variables;
  variables.filter((variable) => variable.defaultSelected).forEach((variable) => compareState.selectedVariables.add(variable.key));

  const controls = document.getElementById("variableControls");
  controls.innerHTML = variables.map((variable) => {
    const note = compareState.cdmxData.sourceNotes?.[variable.key] || variable.description;
    return `<label class="variable-toggle variable-toggle-compact" title="${variable.description}. Source: ${note}"><input type="checkbox" value="${variable.key}" ${compareState.selectedVariables.has(variable.key) ? "checked" : ""}><span>${variable.label}</span></label>`;
  }).join("");

  controls.addEventListener("change", (event) => {
    if (!event.target.matches("input[type='checkbox']")) return;
    if (event.target.checked) compareState.selectedVariables.add(event.target.value);
    else compareState.selectedVariables.delete(event.target.value);
    renderCompare();
  });

  document.getElementById("resetVariables").addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    compareState.selectedVariables = new Set(variables.filter((variable) => variable.defaultSelected).map((variable) => variable.key));
    controls.querySelectorAll("input").forEach((input) => input.checked = compareState.selectedVariables.has(input.value));
    renderCompare();
  });
}

function startPlayback() {
  document.getElementById("playDecades").textContent = "Pause";
  compareState.playTimer = window.setInterval(() => {
    const currentIndex = SHARED_DECADES.indexOf(compareState.decade);
    const nextIndex = currentIndex >= SHARED_DECADES.length - 1 ? 0 : currentIndex + 1;
    compareState.decade = SHARED_DECADES[nextIndex];
    document.getElementById("decadeSlider").value = nextIndex;
    renderCompare();
  }, 850);
}

function stopPlayback() {
  if (compareState.playTimer) window.clearInterval(compareState.playTimer);
  compareState.playTimer = null;
  document.getElementById("playDecades").textContent = "Play";
}

Promise.all([
  fetch("data/paris/uqi-by-arrondissement.json").then((response) => response.json()),
  fetch("data/paris/arrondissements.geojson").then((response) => response.json()),
  fetch("data/cdmx/urban-index-data.json").then((response) => response.json()),
  fetch("data/cdmx/alcaldias.geojson").then((response) => response.json())
]).then(([parisData, parisBoundaries, cdmxData, cdmxBoundaries]) => {
  compareState.parisData = parisData;
  compareState.cdmxData = cdmxData;

  compareState.parisLab = window.createCityLab({
    neighborhoodKey: "arrondissements",
    manageControls: false,
    initNav: false,
    mapWidth: 520,
    mapHeight: 420,
    hdiMapHeight: 360,
    chartWidth: 520,
    chartHeight: 380,
    shortName: (name) => name.replace(" — ", " ").replace("Hôtel-de-Ville", "Hôtel-V.").replace("Buttes-Montmartre", "Montmartre").replace("Buttes-Chaumont", "Chaumont").replace("Ménilmontant", "Ménilm."),
    featureName: (feature) => feature.properties?.name || feature.properties?.l_aroff || "",
    elements: {
      uqiMap: "parisUqiMap",
      hdiMap: "parisHdiMap",
      scatterPlot: "parisScatterPlot",
      uqiLineChart: "parisUqiLineChart"
    }
  });

  compareState.cdmxLab = window.createCityLab({
    neighborhoodKey: "alcaldias",
    manageControls: false,
    initNav: false,
    mapWidth: 520,
    mapHeight: 420,
    hdiMapHeight: 360,
    chartWidth: 520,
    chartHeight: 380,
    aliases: new Map([
      ["magdalena_contreras", "la_magdalena_contreras"],
      ["cuajimalpa", "cuajimalpa_de_morelos"]
    ]),
    shortName: (name) => name.replace("La Magdalena Contreras", "Magdalena C.").replace("Gustavo A. Madero", "G.A. Madero").replace("Venustiano Carranza", "V. Carranza").replace("Cuajimalpa de Morelos", "Cuajimalpa"),
    featureName: (feature) => feature.properties?.alcaldia || feature.properties?.NOMGEO || feature.properties?.nomgeo || "",
    elements: {
      uqiMap: "cdmxUqiMap",
      hdiMap: "cdmxHdiMap",
      scatterPlot: "cdmxScatterPlot",
      uqiLineChart: "cdmxUqiLineChart"
    }
  });

  compareState.parisLab.boot(parisData, parisBoundaries);
  compareState.cdmxLab.boot(cdmxData, cdmxBoundaries);

  initSharedControls();
  renderCompare();

  document.querySelectorAll(".reveal").forEach((item, index) => {
    window.setTimeout(() => item.classList.add("visible"), 80 * index);
  });
}).catch((error) => {
  document.body.insertAdjacentHTML("afterbegin", `<div style="padding:16px;margin:12px;border:1px solid #c9544d;background:#fff;color:#812b27;border-radius:12px"><strong>Compare page error:</strong> ${error.message}</div>`);
});
