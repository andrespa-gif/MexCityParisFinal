const cdmxAliases = new Map([
  ["magdalena_contreras", "la_magdalena_contreras"],
  ["cuajimalpa", "cuajimalpa_de_morelos"]
]);

const lab = window.createCityLab({
  neighborhoodKey: "alcaldias",
  aliases: cdmxAliases,
  shortName: (name) => name.replace("La Magdalena Contreras", "Magdalena C.").replace("Gustavo A. Madero", "G.A. Madero").replace("Venustiano Carranza", "V. Carranza").replace("Cuajimalpa de Morelos", "Cuajimalpa"),
  featureName: (feature) => feature.properties?.alcaldia || feature.properties?.NOMGEO || feature.properties?.nomgeo || ""
});

function bootCdmx(data, boundaries) {
  lab.boot(data, boundaries);
}

if (window.CDMX_URBAN_INDEX_DATA && window.CDMX_ALCALDIAS_GEOJSON) {
  bootCdmx(window.CDMX_URBAN_INDEX_DATA, window.CDMX_ALCALDIAS_GEOJSON);
} else {
  Promise.all([
    fetch("../data/cdmx/urban-index-data.json").then((response) => response.json()),
    fetch("../data/cdmx/alcaldias.geojson").then((response) => response.json())
  ]).then(([data, boundaries]) => bootCdmx(data, boundaries)).catch((error) => {
    const target = document.getElementById("scatterPlot");
    if (target) target.textContent = `Could not load data: ${error.message}`;
  });
}
