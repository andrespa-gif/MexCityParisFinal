const parisAliases = new Map([
  ["1er_louvre", "1er_louvre"],
  ["20e_menilmontant", "20e_menilmontant"]
]);

const lab = window.createCityLab({
  neighborhoodKey: "arrondissements",
  aliases: parisAliases,
  shortName: (name) => name.replace(" — ", " ").replace("Hôtel-de-Ville", "Hôtel-V.").replace("Buttes-Montmartre", "Montmartre").replace("Buttes-Chaumont", "Chaumont").replace("Ménilmontant", "Ménilm."),
  featureName: (feature) => feature.properties?.name || feature.properties?.l_aroff || ""
});

function bootParis(data, boundaries) {
  lab.boot(data, boundaries);
}

Promise.all([
  fetch("../data/paris/uqi-by-arrondissement.json").then((response) => response.json()),
  fetch("../data/paris/arrondissements.geojson").then((response) => response.json())
]).then(([data, boundaries]) => bootParis(data, boundaries)).catch((error) => {
  const target = document.getElementById("scatterPlot");
  if (target) target.textContent = `Could not load Paris data: ${error.message}`;
});
