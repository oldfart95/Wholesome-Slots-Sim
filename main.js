const SYMBOLS = [
  {
    id: "clover",
    name: "Clover",
    weight: 28,
    tier: "common",
    payout3: 12,
    glow: "rgba(177, 227, 132, 0.34)",
    palette: { primary: "#9bd071", secondary: "#ebf6cb", accent: "#5f8f39" },
    render: createCloverSvg
  },
  {
    id: "lantern",
    name: "Lantern",
    weight: 13,
    tier: "rare",
    payout3: 28,
    glow: "rgba(245, 214, 124, 0.34)",
    palette: { primary: "#e1b85f", secondary: "#fff0bd", accent: "#7a5b25" },
    render: createLanternSvg
  },
  {
    id: "ivy-knot",
    name: "Ivy Knot",
    weight: 18,
    tier: "uncommon",
    payout3: 18,
    glow: "rgba(110, 184, 121, 0.28)",
    palette: { primary: "#6ab47c", secondary: "#d9f0d8", accent: "#2d6c47" },
    render: createIvyKnotSvg
  },
  {
    id: "blossom",
    name: "Blossom",
    weight: 16,
    tier: "uncommon",
    payout3: 20,
    glow: "rgba(243, 190, 173, 0.28)",
    palette: { primary: "#f0b7a0", secondary: "#fff0eb", accent: "#c97a66" },
    render: createBlossomSvg
  },
  {
    id: "golden-key",
    name: "Golden Key",
    weight: 9,
    tier: "rare",
    payout3: 36,
    glow: "rgba(247, 214, 121, 0.38)",
    palette: { primary: "#f0cd6d", secondary: "#fff1bc", accent: "#87662a" },
    render: createKeySvg
  },
  {
    id: "dew-drop",
    name: "Dew Drop",
    weight: 22,
    tier: "common",
    payout3: 14,
    glow: "rgba(146, 223, 240, 0.3)",
    palette: { primary: "#8cd7e8", secondary: "#e8ffff", accent: "#4f97ab" },
    render: createDewSvg
  },
  {
    id: "moonleaf",
    name: "Moonleaf",
    weight: 11,
    tier: "rare",
    payout3: 30,
    glow: "rgba(196, 223, 145, 0.3)",
    palette: { primary: "#b9d37a", secondary: "#f7ffd8", accent: "#6f8d35" },
    render: createMoonleafSvg
  }
];

const REEL_COUNT = 3;
const STRIP_REPEAT = 5;
const BASE_RADIANCE = 14;
const SPIN_DURATION = 1720;
const STOP_STAGGER = 320;
const LANDING_BOUNCE = 380;
const CARD_HEIGHT_REM = 11.5;
const CARD_GAP_REM = 0.9;
const AMBIENT_PARTICLE_COUNT = 22;

const appState = {
  radiance: 0,
  spinning: false,
  soundEnabled: false,
  strips: [],
  displayedSymbols: Array.from({ length: REEL_COUNT }, () => []),
  audioContext: null
};

const elements = {
  cabinet: document.querySelector(".cabinet"),
  reels: document.getElementById("reels"),
  reelWindow: document.getElementById("reel-window"),
  reelEffects: document.getElementById("reel-effects"),
  spinButton: document.getElementById("spin-button"),
  soundToggle: document.getElementById("sound-toggle"),
  statusRibbon: document.getElementById("status-ribbon"),
  radianceFill: document.getElementById("radiance-fill"),
  fortuneAmount: document.getElementById("fortune-amount"),
  gardenState: document.getElementById("garden-state"),
  symbolTemplate: document.getElementById("symbol-template"),
  ambientParticles: document.getElementById("ambient-particles")
};

initializeCabinet();

function initializeCabinet() {
  buildReels();
  populateAmbientParticles();
  updateRadiance(BASE_RADIANCE);
  elements.spinButton.addEventListener("click", handleSpin);
  elements.soundToggle.addEventListener("click", toggleSoundState);
}

function buildReels() {
  const stripDefinitions = Array.from({ length: REEL_COUNT }, (_, reelIndex) => createStripSequence(reelIndex));
  elements.reels.replaceChildren();

  appState.strips = stripDefinitions.map((symbols, reelIndex) => {
    const reel = document.createElement("div");
    reel.className = "reel";

    const strip = document.createElement("div");
    strip.className = "reel-strip";

    const repeatedSymbols = Array.from({ length: STRIP_REPEAT }, () => symbols).flat();
    repeatedSymbols.forEach((symbol) => {
      strip.appendChild(createSymbolCard(symbol));
    });

    reel.appendChild(strip);
    elements.reels.appendChild(reel);

    const startIndex = symbols.length * Math.floor(STRIP_REPEAT / 2);
    const initialWindow = getVisibleWindow(repeatedSymbols, startIndex);
    positionStrip(strip, startIndex);

    appState.displayedSymbols[reelIndex] = initialWindow;

    return {
      reel,
      strip,
      baseSymbols: symbols,
      repeatedSymbols,
      currentIndex: startIndex
    };
  });
}

async function handleSpin() {
  if (appState.spinning) {
    return;
  }

  appState.spinning = true;
  elements.cabinet.classList.add("is-spinning");
  clearWinningState();
  pulseButton();
  setCabinetMessage("The brass guides stir and the lantern glass brightens...");
  elements.gardenState.textContent = "Whirring";
  elements.spinButton.disabled = true;
  playSpinCue();

  const results = appState.strips.map((_, reelIndex) => {
    const symbol = weightedPick(SYMBOLS);
    return {
      stopSymbol: symbol,
      stopIndex: findCenteredSymbolIndex(
        appState.strips[reelIndex],
        symbol.id,
        appState.strips[reelIndex].currentIndex + appState.strips[reelIndex].baseSymbols.length * (2 + reelIndex)
      )
    };
  });

  const spinPromises = appState.strips.map((stripState, reelIndex) => {
    stripState.reel.classList.add("reel--spinning");
    const targetIndex = results[reelIndex].stopIndex;

    return animateReelStop(stripState, targetIndex, reelIndex);
  });

  await Promise.all(spinPromises);

  const centerLine = appState.displayedSymbols.map((windowSymbols) => windowSymbols[1]);
  const result = evaluateSpin(centerLine);
  applySpinResult(result, centerLine);

  appState.spinning = false;
  elements.cabinet.classList.remove("is-spinning");
  elements.spinButton.disabled = false;
}

function animateReelStop(stripState, targetIndex, reelIndex) {
  return new Promise((resolve) => {
    const duration = SPIN_DURATION + reelIndex * STOP_STAGGER;
    const targetTranslate = calculateTranslate(targetIndex);

    window.setTimeout(() => {
      emitReelSparks(reelIndex, 4 + reelIndex);
    }, Math.max(120, duration - 280));

    requestAnimationFrame(() => {
      stripState.strip.style.transition = `transform ${duration}ms cubic-bezier(0.16, 0.78, 0.18, 1)`;
      stripState.strip.style.transform = `translateY(${targetTranslate}rem)`;
    });

    window.setTimeout(() => {
      stripState.reel.classList.remove("reel--spinning");
      stripState.reel.classList.add("reel--landed");
      stripState.currentIndex = targetIndex;
      appState.displayedSymbols[reelIndex] = getVisibleWindow(stripState.repeatedSymbols, targetIndex);
      playStopCue(reelIndex);

      window.setTimeout(() => {
        normalizeStripPosition(stripState);
        stripState.reel.classList.remove("reel--landed");
        resolve();
      }, LANDING_BOUNCE);
    }, duration);
  });
}

function applySpinResult(result, centerLine) {
  highlightWinningSymbols(result, centerLine);

  if (result.type === "jackpot") {
    updateRadiance(26);
    setCabinetMessage(`Garden Blessing: three ${centerLine[0].name} emblems bloom in unison.`);
    elements.fortuneAmount.textContent = `${result.reward} Fortune`;
    elements.gardenState.textContent = "Lantern Glow";
    flashReelWindow();
    celebrateCabinet();
    emitReelSparks(1, 16);
    playWinCue("jackpot");
  } else if (result.type === "pair") {
    updateRadiance(12);
    setCabinetMessage(`A soft harmony settles in: ${result.label}.`);
    elements.fortuneAmount.textContent = `${result.reward} Fortune`;
    elements.gardenState.textContent = "Soft Bloom";
    emitReelSparks(1, 8);
    playWinCue("pair");
  } else {
    updateRadiance(-7);
    setCabinetMessage(result.label);
    elements.fortuneAmount.textContent = "Quiet turn";
    elements.gardenState.textContent = "Stillness";
    playWinCue("miss");
  }
}

function evaluateSpin(centerLine) {
  const [first, second, third] = centerLine;

  if (first.id === second.id && second.id === third.id) {
    return {
      type: "jackpot",
      reward: first.payout3,
      label: `${first.name} trio`
    };
  }

  if (first.id === second.id || second.id === third.id || first.id === third.id) {
    const pairSymbol = first.id === second.id ? first : second.id === third.id ? second : first;
    return {
      type: "pair",
      reward: Math.ceil(pairSymbol.payout3 / 3),
      label: `${pairSymbol.name} pairing`
    };
  }

  const rareCount = centerLine.filter((symbol) => symbol.tier === "rare").length;
  if (rareCount >= 2) {
    return {
      type: "pair",
      reward: 8,
      label: "Rare ornaments glimmer, but do not yet align"
    };
  }

  return {
    type: "miss",
    reward: 0,
    label: "The garden exhales and returns to a gentle hush."
  };
}

function updateRadiance(delta) {
  appState.radiance = clamp(appState.radiance + delta, 10, 100);
  elements.radianceFill.style.width = `${appState.radiance}%`;
  elements.radianceFill.style.boxShadow = `0 0 ${0.3 + appState.radiance / 28}rem rgba(247, 214, 121, 0.34)`;
}

function setCabinetMessage(message) {
  elements.statusRibbon.textContent = message;
}

function toggleSoundState() {
  appState.soundEnabled = !appState.soundEnabled;
  elements.soundToggle.setAttribute("aria-pressed", String(appState.soundEnabled));
  elements.soundToggle.textContent = appState.soundEnabled ? "Sound aglow" : "Sound ready";
  ensureAudioContext();
  playTone({ frequency: appState.soundEnabled ? 520 : 300, duration: 0.08, type: "sine", volume: 0.018 });
  setCabinetMessage(appState.soundEnabled
    ? "The cabinet murmurs with soft brass clicks and lantern chimes."
    : "The cabinet falls back to lantern hush; sound hooks remain ready.");
}

function clearWinningState() {
  elements.reelWindow.classList.remove("is-win");
  document.querySelectorAll(".symbol-card.is-winning").forEach((card) => {
    card.classList.remove("is-winning");
  });
}

function highlightWinningSymbols(result, centerLine) {
  if (result.type === "miss") {
    return;
  }

  appState.strips.forEach((stripState, reelIndex) => {
    const visibleCards = Array.from(stripState.reel.querySelectorAll(".symbol-card")).slice(
      stripState.currentIndex - 1,
      stripState.currentIndex + 2
    );

    visibleCards.forEach((card, rowIndex) => {
      if (rowIndex === 1 && shouldHighlight(result, centerLine, centerLine[reelIndex])) {
        card.classList.add("is-winning");
      }
    });
  });
}

function shouldHighlight(result, centerLine, reelSymbol) {
  if (result.type === "jackpot") {
    return true;
  }

  const counts = centerLine.reduce((map, symbol) => {
    map.set(symbol.id, (map.get(symbol.id) || 0) + 1);
    return map;
  }, new Map());

  return counts.get(reelSymbol.id) >= 2;
}

function flashReelWindow() {
  elements.reelWindow.classList.remove("is-win");
  void elements.reelWindow.offsetWidth;
  elements.reelWindow.classList.add("is-win");
}

function createStripSequence(reelIndex) {
  const basePool = [...SYMBOLS];
  const rotation = reelIndex * 2;
  const rotated = [...basePool.slice(rotation), ...basePool.slice(0, rotation)];

  return [
    ...rotated,
    rotated[1],
    rotated[4],
    rotated[2],
    rotated[5],
    rotated[0]
  ];
}

function weightedPick(symbols) {
  const total = symbols.reduce((sum, symbol) => sum + symbol.weight, 0);
  let threshold = Math.random() * total;

  for (const symbol of symbols) {
    threshold -= symbol.weight;
    if (threshold <= 0) {
      return symbol;
    }
  }

  return symbols[symbols.length - 1];
}

function findCenteredSymbolIndex(stripState, symbolId, minimumIndex) {
  const { repeatedSymbols } = stripState;
  for (let index = Math.max(1, Math.floor(minimumIndex)); index < repeatedSymbols.length - 1; index += 1) {
    if (repeatedSymbols[index].id === symbolId) {
      return index;
    }
  }

  return repeatedSymbols.findIndex((symbol, index) => symbol.id === symbolId && index > 0 && index < repeatedSymbols.length - 1);
}

function getVisibleWindow(repeatedSymbols, centerIndex) {
  return repeatedSymbols.slice(centerIndex - 1, centerIndex + 2);
}

function calculateTranslate(centerIndex) {
  const step = CARD_HEIGHT_REM + CARD_GAP_REM;
  return -(centerIndex * step);
}

function positionStrip(strip, centerIndex) {
  strip.style.transform = `translateY(${calculateTranslate(centerIndex)}rem)`;
}

function normalizeStripPosition(stripState) {
  const normalizedIndex = stripState.baseSymbols.length * 2 + (stripState.currentIndex % stripState.baseSymbols.length);
  stripState.currentIndex = normalizedIndex;
  appState.displayedSymbols[appState.strips.indexOf(stripState)] = getVisibleWindow(stripState.repeatedSymbols, normalizedIndex);
  stripState.strip.style.transition = "none";
  positionStrip(stripState.strip, normalizedIndex);

  requestAnimationFrame(() => {
    stripState.strip.style.transition = "";
  });
}

function populateAmbientParticles() {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < AMBIENT_PARTICLE_COUNT; index += 1) {
    const particle = document.createElement("span");
    particle.className = "ambient-particle";
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.bottom = `${-10 - Math.random() * 35}%`;
    particle.style.setProperty("--duration", `${14 + Math.random() * 18}s`);
    particle.style.setProperty("--delay", `${-Math.random() * 18}s`);
    particle.style.setProperty("--drift-x", `${(Math.random() * 7 - 3.5).toFixed(2)}rem`);
    particle.style.width = `${0.18 + Math.random() * 0.38}rem`;
    particle.style.height = particle.style.width;
    fragment.appendChild(particle);
  }

  elements.ambientParticles.replaceChildren(fragment);
}

function emitReelSparks(reelIndex, count) {
  const reelCenter = ((reelIndex + 0.5) / REEL_COUNT) * 100;

  for (let index = 0; index < count; index += 1) {
    const spark = document.createElement("span");
    spark.className = "reel-spark";
    spark.style.left = `${reelCenter + (Math.random() * 14 - 7)}%`;
    spark.style.bottom = `${12 + Math.random() * 18}%`;
    spark.style.setProperty("--spark-drift", `${(Math.random() * 2.8 - 1.4).toFixed(2)}rem`);
    spark.style.animationDelay = `${index * 18}ms`;
    elements.reelEffects.appendChild(spark);
    window.setTimeout(() => spark.remove(), 980);
  }
}

function pulseButton() {
  elements.spinButton.animate(
    [
      { transform: "translateY(0) scale(1)" },
      { transform: "translateY(2px) scale(0.986)" },
      { transform: "translateY(0) scale(1)" }
    ],
    { duration: 240, easing: "ease-out" }
  );
}

function celebrateCabinet() {
  elements.cabinet.classList.remove("is-celebrating");
  void elements.cabinet.offsetWidth;
  elements.cabinet.classList.add("is-celebrating");
  window.setTimeout(() => {
    elements.cabinet.classList.remove("is-celebrating");
  }, 1240);
}

function createSymbolCard(symbol) {
  const fragment = elements.symbolTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".symbol-card");
  const inner = fragment.querySelector(".symbol-card__inner");
  const art = fragment.querySelector(".symbol-card__art");
  const name = fragment.querySelector(".symbol-card__name");
  const uid = `${symbol.id}-${Math.random().toString(36).slice(2, 8)}`;

  inner.style.setProperty("--symbol-glow", symbol.glow);
  art.appendChild(symbol.render(symbol.palette, uid));
  name.textContent = symbol.name;
  card.dataset.symbolId = symbol.id;

  return fragment;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createSvg(viewBox, content) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", viewBox);
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = content.trim();
  return svg;
}

function ensureAudioContext() {
  if (!appState.soundEnabled) {
    return null;
  }

  if (!appState.audioContext) {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) {
      return null;
    }
    appState.audioContext = new AudioContextCtor();
  }

  if (appState.audioContext.state === "suspended") {
    appState.audioContext.resume();
  }

  return appState.audioContext;
}

function playTone({ frequency, duration, type = "sine", volume = 0.03, delay = 0, attack = 0.01, release = 0.12 }) {
  const context = ensureAudioContext();
  if (!context) {
    return;
  }

  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration + release);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + release + 0.02);
}

function playSpinCue() {
  playTone({ frequency: 180, duration: 0.08, type: "triangle", volume: 0.028 });
  playTone({ frequency: 310, duration: 0.06, type: "sine", volume: 0.018, delay: 0.04 });
}

function playStopCue(reelIndex) {
  playTone({
    frequency: 300 + reelIndex * 36,
    duration: 0.05,
    type: "triangle",
    volume: 0.022 + reelIndex * 0.003
  });
}

function playWinCue(resultType) {
  if (resultType === "jackpot") {
    playTone({ frequency: 440, duration: 0.12, type: "sine", volume: 0.03 });
    playTone({ frequency: 554, duration: 0.16, type: "sine", volume: 0.028, delay: 0.08 });
    playTone({ frequency: 660, duration: 0.22, type: "triangle", volume: 0.022, delay: 0.18 });
    return;
  }

  if (resultType === "pair") {
    playTone({ frequency: 392, duration: 0.1, type: "sine", volume: 0.024 });
    playTone({ frequency: 494, duration: 0.14, type: "triangle", volume: 0.018, delay: 0.07 });
    return;
  }

  playTone({ frequency: 220, duration: 0.07, type: "triangle", volume: 0.012 });
}

function createCloverSvg(palette, uid) {
  return createSvg(
    "0 0 100 100",
    `
      <defs>
        <linearGradient id="cloverLeaf-${uid}" x1="0" x2="1">
          <stop offset="0%" stop-color="${palette.secondary}" />
          <stop offset="100%" stop-color="${palette.primary}" />
        </linearGradient>
      </defs>
      <g fill="url(#cloverLeaf-${uid})" stroke="${palette.accent}" stroke-width="3.2" stroke-linejoin="round">
        <path d="M50 18c8 0 15 7 15 15 0 8-7 15-15 22-8-7-15-14-15-22 0-8 7-15 15-15z"/>
        <path d="M22 40c8 0 15 7 22 15-7 8-14 15-22 15-8 0-15-7-15-15 0-8 7-15 15-15z"/>
        <path d="M78 40c8 0 15 7 15 15 0 8-7 15-15 15-8 0-15-7-22-15 7-8 14-15 22-15z"/>
        <path d="M50 56c8 7 15 14 15 22 0 8-7 15-15 15-8 0-15-7-15-15 0-8 7-15 15-22z"/>
      </g>
      <path d="M50 57c0 18 0 24-10 31" fill="none" stroke="${palette.accent}" stroke-width="4" stroke-linecap="round"/>
    `
  );
}

function createLanternSvg(palette, uid) {
  return createSvg(
    "0 0 100 100",
    `
      <defs>
        <linearGradient id="lanternBody-${uid}" x1="0" x2="1">
          <stop offset="0%" stop-color="${palette.primary}" />
          <stop offset="100%" stop-color="${palette.secondary}" />
        </linearGradient>
      </defs>
      <path d="M38 18h24" stroke="${palette.accent}" stroke-width="5" stroke-linecap="round"/>
      <path d="M42 18c0-7 3-10 8-10s8 3 8 10" fill="none" stroke="${palette.accent}" stroke-width="4"/>
      <path d="M32 28h36l-4 42c-1 9-7 14-14 14s-13-5-14-14l-4-42z" fill="url(#lanternBody-${uid})" stroke="${palette.accent}" stroke-width="4"/>
      <rect x="39" y="34" width="22" height="24" rx="8" fill="${palette.secondary}" opacity="0.8"/>
      <path d="M41 82h18" stroke="${palette.accent}" stroke-width="5" stroke-linecap="round"/>
    `
  );
}

function createIvyKnotSvg(palette) {
  return createSvg(
    "0 0 100 100",
    `
      <path d="M28 68c14 0 16-20 24-20 10 0 10 20 24 20" fill="none" stroke="${palette.secondary}" stroke-width="6" stroke-linecap="round"/>
      <path d="M25 34c9 0 16 8 16 17S34 68 25 68s-16-8-16-17 7-17 16-17zm50 0c9 0 16 8 16 17S84 68 75 68s-16-8-16-17 7-17 16-17z" fill="none" stroke="${palette.accent}" stroke-width="4"/>
      <path d="M23 50c9-3 18-14 18-24 12 2 18 8 20 19-8 9-18 13-38 5zm54 0c-9-3-18-14-18-24-12 2-18 8-20 19 8 9 18 13 38 5z" fill="${palette.primary}" opacity="0.95"/>
    `
  );
}

function createBlossomSvg(palette) {
  return createSvg(
    "0 0 100 100",
    `
      <g fill="${palette.primary}" stroke="${palette.accent}" stroke-width="3.2">
        <path d="M50 16c8 0 13 8 13 17S57 49 50 52c-7-3-13-10-13-19S42 16 50 16z"/>
        <path d="M77 33c7 4 8 14 4 21S66 67 58 64c-3-8 1-19 8-26 6-6 9-8 11-5z"/>
        <path d="M69 72c0 8-8 13-17 13S36 79 33 72c3-7 10-13 19-13s16 6 17 13z"/>
        <path d="M23 33c2-3 5-1 11 5 7 7 11 18 8 26-8 3-19-2-23-10s-3-17 4-21z"/>
      </g>
      <circle cx="50" cy="50" r="8" fill="${palette.secondary}" stroke="${palette.accent}" stroke-width="3"/>
    `
  );
}

function createKeySvg(palette) {
  return createSvg(
    "0 0 100 100",
    `
      <circle cx="35" cy="39" r="14" fill="none" stroke="${palette.primary}" stroke-width="6"/>
      <circle cx="35" cy="39" r="5" fill="${palette.secondary}" />
      <path d="M47 48l28 28" stroke="${palette.primary}" stroke-width="7" stroke-linecap="round"/>
      <path d="M68 69h13v8h-8v8h-8v-8h3z" fill="${palette.primary}" stroke="${palette.accent}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M47 48l8-8" stroke="${palette.accent}" stroke-width="4" stroke-linecap="round"/>
    `
  );
}

function createDewSvg(palette, uid) {
  return createSvg(
    "0 0 100 100",
    `
      <defs>
        <linearGradient id="dewBody-${uid}" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="${palette.secondary}" />
          <stop offset="100%" stop-color="${palette.primary}" />
        </linearGradient>
      </defs>
      <path d="M50 15c11 16 24 30 24 46 0 14-10 24-24 24S26 75 26 61c0-16 13-30 24-46z" fill="url(#dewBody-${uid})" stroke="${palette.accent}" stroke-width="4"/>
      <path d="M41 34c4-6 8-11 11-15" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
      <ellipse cx="45" cy="55" rx="8" ry="12" fill="#ffffff" opacity="0.16"/>
    `
  );
}

function createMoonleafSvg(palette) {
  return createSvg(
    "0 0 100 100",
    `
      <path d="M66 18c-19 3-35 19-38 39-3 18 6 31 23 31 21 0 34-17 36-38 2-18-6-35-21-32z" fill="${palette.primary}" stroke="${palette.accent}" stroke-width="4"/>
      <path d="M41 69c13-10 26-22 34-39" fill="none" stroke="${palette.secondary}" stroke-width="4" stroke-linecap="round"/>
      <path d="M55 26c8 2 13 10 13 18" fill="none" stroke="${palette.secondary}" stroke-width="3.5" stroke-linecap="round" opacity="0.8"/>
      <circle cx="31" cy="26" r="7" fill="${palette.secondary}" opacity="0.8"/>
    `
  );
}
