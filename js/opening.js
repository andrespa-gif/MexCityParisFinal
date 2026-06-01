(function initOpening() {
  const OPENING = {
    phases: [
      { text: "Two cities with central planning starting in the 1880s." },
      { text: "Twelve kilometers apart. Very different." },
      { text: "Twelve kilometers apart. Very different." },
      { text: "Has urban planning produced equal cities?" }
    ],
    left: [
      {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Paris_-_View_from_Notre-Dame%2C_2016.jpg/1280px-Paris_-_View_from_Notre-Dame%2C_2016.jpg",
        alt: "Paris: Haussmann boulevards and planned center."
      },
      {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Paris_-_Pair_of_Haussmannian_buildings_on_boulevard_de_S%C3%A9bastopol.jpg/1280px-Paris_-_Pair_of_Haussmannian_buildings_on_boulevard_de_S%C3%A9bastopol.jpg",
        alt: "Wealthy Paris: 7th arrondissement Haussmann boulevard."
      },
      {
        src: "images/mexico/reforma-angel.png",
        alt: "Mexico City · Miguel Hidalgo: Paseo de la Reforma and the Angel of Independence."
      },
      {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Paris_-_Pair_of_Haussmannian_buildings_on_boulevard_de_S%C3%A9bastopol.jpg/1280px-Paris_-_Pair_of_Haussmannian_buildings_on_boulevard_de_S%C3%A9bastopol.jpg",
        alt: "Paris."
      }
    ],
    right: [
      {
        src: "images/mexico/condesa.png",
        alt: "Mexico City: Parque México and the planned Condesa grid from above."
      },
      {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Banlieue_parisienne_%28Sevran%29.jpg/1280px-Banlieue_parisienne_%28Sevran%29.jpg",
        alt: "Poor Paris: 19th arrondissement edge and peripheral estates."
      },
      {
        src: "images/mexico/iztapalapa.png",
        alt: "Mexico City · Iztapalapa: Cablebús over dense hillside colonias."
      },
      {
        src: "images/mexico/condesa.png",
        alt: "Mexico City."
      }
    ],
    holdMs: 5500,
    textOutMs: 400
  };

  const section = document.getElementById("opening");
  if (!section) return;

  const leftA = section.querySelector("#paris-img-a");
  const leftB = section.querySelector("#paris-img-b");
  const rightA = section.querySelector("#cdmx-img-a");
  const rightB = section.querySelector("#cdmx-img-b");
  const leftLabel = section.querySelector(".paris-panel .city-label");
  const rightLabel = section.querySelector(".cdmx-panel .city-label");
  const phaseText = section.querySelector("#phase-text");
  const dots = section.querySelectorAll(".phase-dot");
  const LABELS = [
    { left: "Paris", right: "CDMX" },
    { left: "Paris · wealthy", right: "Paris · poor" },
    { left: "Mexico City · Miguel Hidalgo", right: "Mexico City · Iztapalapa" },
    { left: "Paris", right: "CDMX" }
  ];
  let phase = 0;
  let showA = true;
  let timer = null;

  function setImage(img, data) {
    if (!img || !data) return;
    img.src = data.src;
    img.alt = data.alt;
  }

  function preload() {
    [...OPENING.left, ...OPENING.right].forEach((item) => {
      const img = new Image();
      img.src = item.src;
    });
  }

  function swapImages(next) {
    const activeLeft = showA ? leftA : leftB;
    const hiddenLeft = showA ? leftB : leftA;
    const activeRight = showA ? rightA : rightB;
    const hiddenRight = showA ? rightB : rightA;
    setImage(hiddenLeft, OPENING.left[next]);
    setImage(hiddenRight, OPENING.right[next]);
    hiddenLeft.classList.add("visible");
    hiddenRight.classList.add("visible");
    activeLeft.classList.remove("visible");
    activeRight.classList.remove("visible");
    showA = !showA;
  }

  function updatePhase(next) {
    phaseText.classList.toggle("question-phase", next === 3);
    if (leftLabel) leftLabel.innerHTML = `<span class="city-dot paris-dot"></span>${LABELS[next].left}`;
    if (rightLabel) rightLabel.innerHTML = `<span class="city-dot cdmx-dot"></span>${LABELS[next].right}`;
    phaseText.style.opacity = "0";
    window.setTimeout(() => {
      phaseText.textContent = OPENING.phases[next].text;
      phaseText.style.opacity = "1";
    }, OPENING.textOutMs);
    dots.forEach((dot, i) => dot.classList.toggle("active", i === next));
    swapImages(next);
    phase = next;
  }

  function cycle() {
    updatePhase((phase + 1) % OPENING.phases.length);
  }

  function start() {
    setImage(leftA, OPENING.left[0]);
    setImage(rightA, OPENING.right[0]);
    leftA.classList.add("visible");
    rightA.classList.add("visible");
    phaseText.textContent = OPENING.phases[0].text;
    dots[0]?.classList.add("active");
    preload();
    timer = window.setInterval(cycle, OPENING.holdMs);
  }

  start();
})();
