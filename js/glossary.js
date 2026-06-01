(function initGlossary() {
  const GLOSSARY = {
    arrondissement: "One of the 20 administrative districts of Paris, each with its own mayor and council.",
    alcaldía: "One of the 16 borough-level jurisdictions of Mexico City, established in 2016.",
    Haussmannization: "The large-scale renovation of Paris under Baron Haussmann (1853–1870): wide boulevards, sewers, parks, standardized buildings.",
    Porfiriato: "The period of Porfirio Díaz's rule in Mexico (1876–1911), marked by modernization, foreign investment, and imported European planning ideals.",
    "colonias populares": "Working-class neighborhoods in Mexico City, often self-built by residents before formal infrastructure arrived.",
    banlieue: "The suburbs surrounding Paris, often associated with postwar housing estates and peripheral disadvantage.",
    gentrification: "The process by which wealthier residents and investment move into a working-class neighborhood, raising rents and often displacing long-term residents.",
    UQI: "Urban Quality Index, a composite score measuring neighborhood-level planning quality across transit, parks, services, and infrastructure.",
    HDI: "Human Development Index, a UN measure combining life expectancy, education, and income into a single score (0–1).",
    "spatial inequality": "Unequal conditions based on where people live within the same city.",
    "Trente Glorieuses": "France's thirty-year postwar economic boom (1945–1975), during which massive public housing estates were built.",
    INSEE: "France's national statistics institute, the source for population, income, education, and housing data.",
    INEGI: "Mexico's national statistics institute, the source for census and survey data."
  };

  const used = new Set();

  function wrapTerm(textNode, term) {
    const parent = textNode.parentElement;
    if (!parent || parent.closest(".gloss-pair") || parent.closest("script")) return;
    const text = textNode.textContent;
    const index = text.indexOf(term);
    if (index === -1) return;
    const before = text.slice(0, index);
    const after = text.slice(index + term.length);
    const pair = document.createElement("span");
    pair.className = "gloss-pair";
    pair.innerHTML = `<button type="button" class="gloss-trigger" aria-expanded="false">${term}</button><span class="gloss-pop" role="tooltip">${GLOSSARY[term]}</span>`;
    const frag = document.createDocumentFragment();
    if (before) frag.appendChild(document.createTextNode(before));
    frag.appendChild(pair);
    if (after) frag.appendChild(document.createTextNode(after));
    parent.replaceChild(frag, textNode);
    if (after) {
      const rest = parent.childNodes[parent.childNodes.length - 1];
      if (rest?.nodeType === Node.TEXT_NODE) walk(rest);
    }
  }

  function walk(node) {
    if (node.nodeType !== Node.TEXT_NODE) {
      [...node.childNodes].forEach(walk);
      return;
    }
    for (const term of Object.keys(GLOSSARY)) {
      if (used.has(term)) continue;
      if (node.textContent.includes(term)) {
        used.add(term);
        wrapTerm(node, term);
        return;
      }
    }
  }

  document.querySelectorAll("main, .site-footer").forEach(walk);

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest(".gloss-trigger");
    if (trigger) {
      event.preventDefault();
      const pair = trigger.closest(".gloss-pair");
      const open = pair.classList.toggle("open");
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
      document.querySelectorAll(".gloss-pair.open").forEach((other) => {
        if (other !== pair) {
          other.classList.remove("open");
          other.querySelector(".gloss-trigger")?.setAttribute("aria-expanded", "false");
        }
      });
      return;
    }
    document.querySelectorAll(".gloss-pair.open").forEach((pair) => {
      pair.classList.remove("open");
      pair.querySelector(".gloss-trigger")?.setAttribute("aria-expanded", "false");
    });
  });
})();
