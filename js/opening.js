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
        src: "/images/opening/paris-intro.png",
        alt: "Paris: Arc de Triomphe and Haussmann radiating avenues from above."
      },
      {
        src: "/images/opening/paris-7e.png",
        alt: "Paris · 7th arrondissement: Eiffel Tower, Seine, and the planned western center."
      },
      {
        src: "/images/mexico/reforma-angel.png",
        alt: "Mexico City · Miguel Hidalgo: Paseo de la Reforma and the Angel of Independence."
      },
      {
        src: "/images/opening/paris-arc.png",
        alt: "Paris: Arc de Triomphe and radiating Haussmann avenues at night."
      }
    ],
    right: [
      {
        src: "/images/opening/cdmx-grandiose-condesa.png",
        alt: "CDMX: Parque México and the planned Condesa grid from above."
      },
      {
        src: "/images/opening/paris-19e.png",
        alt: "Paris · 19th arrondissement: peripheral grands ensembles and dense housing blocks."
      },
      {
        src: "/images/mexico/iztapalapa.png",
        alt: "Mexico City · Iztapalapa: Cablebús over dense hillside colonias."
      },
      {
        src: "/images/opening/cdmx-question.png",
        alt: "CDMX: Santa Fe skyline and Parque La Mexicana at dusk."
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
    { left: "Paris", right: "Mexico City" },
    { left: "Paris · 7th arrondissement", right: "Paris · 19th arrondissement" },
    { left: "Mexico City · Miguel Hidalgo", right: "Mexico City · Iztapalapa" },
    { left: "Paris", right: "Mexico City" }
  ];
  let phase = 0;
  let showA = true;
  let timer = null;

  function setImage(img, data) {
    if (!img || !data) return;
    img.onerror = () => console.warn("Opening image failed:", data.src);
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
    const rightDot = next === 1 ? "paris-dot" : next === 2 ? "cdmx-dot" : "cdmx-dot";
    const leftDot = next === 2 ? "cdmx-dot" : "paris-dot";
    if (leftLabel) leftLabel.innerHTML = `<span class="city-dot ${leftDot}"></span>${LABELS[next].left}`;
    if (rightLabel) rightLabel.innerHTML = `<span class="city-dot ${rightDot}"></span>${LABELS[next].right}`;
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
