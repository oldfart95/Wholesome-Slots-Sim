import { SYMBOLS } from "../config/symbols.js";
import { GAME_RULES, SPECIAL_PATTERNS, evaluateCenterLine } from "../config/paytable.js";
import { THEME } from "../config/theme.js";
import { MotionController } from "../engine/animation.js";
import { SoundController } from "../engine/audio.js";
import { ReelEngine, calculateTranslate } from "../engine/reels.js";

const AMBIENT_PARTICLE_COUNT = 26;

export class GardenOfFortune {
  constructor() {
    this.reels = new ReelEngine();
    this.sound = new SoundController();
    this.motion = null;
    this.displayedSymbols = [];
    this.awakened = false;
    this.spinning = false;
    this.radiance = 0;
    this.credits = GAME_RULES.startingCredits;
    this.stats = {
      spins: 0,
      wins: 0,
      totalWon: 0,
      biggestWin: 0
    };

    this.elements = {
      cabinetShell: document.getElementById("cabinet-shell"),
      startSequence: document.getElementById("start-sequence"),
      startButton: document.getElementById("start-button"),
      cabinet: document.querySelector(".cabinet"),
      reels: document.getElementById("reels"),
      reelWindow: document.getElementById("reel-window"),
      reelEffects: document.getElementById("reel-effects"),
      spinButton: document.getElementById("spin-button"),
      soundToggle: document.getElementById("sound-toggle"),
      speedSelect: document.getElementById("speed-select"),
      resetButton: document.getElementById("reset-button"),
      paytableButton: document.getElementById("paytable-button"),
      paytableModal: document.getElementById("paytable-modal"),
      closePaytable: document.getElementById("close-paytable"),
      paytableList: document.getElementById("paytable-list"),
      patternList: document.getElementById("pattern-list"),
      statusRibbon: document.getElementById("status-ribbon"),
      radianceFill: document.getElementById("radiance-fill"),
      fortuneAmount: document.getElementById("fortune-amount"),
      gardenState: document.getElementById("garden-state"),
      creditAmount: document.getElementById("credit-amount"),
      betAmount: document.getElementById("bet-amount"),
      statSpins: document.getElementById("stat-spins"),
      statWins: document.getElementById("stat-wins"),
      statBest: document.getElementById("stat-best"),
      symbolTemplate: document.getElementById("symbol-template"),
      ambientParticles: document.getElementById("ambient-particles"),
      fictionNotice: document.getElementById("fiction-notice")
    };
  }

  init() {
    this.motion = new MotionController({
      effectsRoot: this.elements.reelEffects,
      soundController: this.sound,
      metrics: this.getMetrics()
    });

    this.populateCopy();
    this.buildReelDom();
    this.populateAmbientParticles();
    this.populatePaytable();
    this.bindEvents();
    this.updateRadiance(14);
    this.updateReadouts();
    this.elements.spinButton.disabled = true;
  }

  populateCopy() {
    this.elements.fictionNotice.textContent = THEME.fictionNotice;
    this.setMessage(THEME.idleMessage);
    this.elements.betAmount.textContent = GAME_RULES.betPerSpin;
  }

  bindEvents() {
    this.elements.startButton.addEventListener("click", () => this.awakenCabinet());
    this.elements.spinButton.addEventListener("click", () => this.handleSpin());
    this.elements.soundToggle.addEventListener("click", () => this.toggleSound());
    this.elements.speedSelect.addEventListener("change", () => this.motion.setSpeed(this.elements.speedSelect.value));
    this.elements.resetButton.addEventListener("click", () => this.resetSession());
    this.elements.paytableButton.addEventListener("click", () => this.openPaytable());
    this.elements.closePaytable.addEventListener("click", () => this.closePaytable());
    this.elements.paytableModal.addEventListener("click", (event) => {
      if (event.target === this.elements.paytableModal) {
        this.closePaytable();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.closePaytable();
      }
    });
  }

  buildReelDom() {
    this.elements.reels.replaceChildren();

    this.reels.strips.forEach((stripDefinition, reelIndex) => {
      const reel = document.createElement("div");
      reel.className = "reel";

      const strip = document.createElement("div");
      strip.className = "reel-strip";

      stripDefinition.repeatedSymbols.forEach((symbol) => {
        strip.appendChild(this.createSymbolCard(symbol));
      });

      reel.appendChild(strip);
      this.elements.reels.appendChild(reel);
      stripDefinition.reelElement = reel;
      stripDefinition.stripElement = strip;
      strip.style.transform = `translateY(${calculateTranslate(stripDefinition.currentIndex, this.getMetrics())}rem)`;
    });

    this.displayedSymbols = this.reels.getInitialWindows();
  }

  async awakenCabinet() {
    if (this.awakened) {
      return;
    }

    this.awakened = true;
    this.elements.startSequence.classList.add("is-hidden");
    this.elements.cabinetShell.classList.remove("cabinet-shell--sleeping");
    this.elements.cabinetShell.classList.add("is-awakening");
    this.elements.spinButton.disabled = false;
    this.setMessage("Lanterns rise in the glass, and the cabinet answers your hand.");
    this.elements.gardenState.textContent = "Awakening";
    this.updateRadiance(10);
    this.motion.emitSparks(1, 10);

    window.setTimeout(() => {
      this.elements.cabinetShell.classList.remove("is-awakening");
      this.setMessage(THEME.readyMessage);
      this.elements.gardenState.textContent = "Ready";
    }, 1500);
  }

  async handleSpin() {
    if (this.spinning || !this.awakened || this.credits < GAME_RULES.betPerSpin) {
      if (this.credits < GAME_RULES.betPerSpin) {
        this.setMessage(THEME.brokeMessage);
      }
      return;
    }

    this.spinning = true;
    this.motion.metrics = this.getMetrics();
    this.credits -= GAME_RULES.betPerSpin;
    this.stats.spins += 1;
    this.elements.cabinet.classList.add("is-spinning");
    this.clearWinningState();
    this.motion.pulseButton(this.elements.spinButton);
    this.setMessage(THEME.spinMessage);
    this.elements.gardenState.textContent = "Whirring";
    this.elements.spinButton.disabled = true;
    this.updateReadouts();
    this.sound.spin();

    const plan = this.reels.createSpinPlan();
    const spinPromises = this.reels.strips.map((strip, reelIndex) => {
      strip.reelElement.classList.add("reel--spinning");

      return this.motion.animateReelStop({
        stripElement: strip.stripElement,
        reelElement: strip.reelElement,
        reelIndex,
        targetIndex: plan[reelIndex].stopIndex,
        onCommit: () => {
          this.displayedSymbols[reelIndex] = this.reels.commitStop(reelIndex, plan[reelIndex].stopIndex);
        },
        onNormalize: () => this.reels.normalize(reelIndex)
      });
    });

    await Promise.all(spinPromises);

    const centerLine = this.displayedSymbols.map((windowSymbols) => windowSymbols[1]);
    const result = evaluateCenterLine(centerLine);
    this.applySpinResult(result, centerLine);

    this.spinning = false;
    this.elements.cabinet.classList.remove("is-spinning");
    this.elements.spinButton.disabled = this.credits < GAME_RULES.betPerSpin;
  }

  applySpinResult(result, centerLine) {
    this.credits += result.reward;
    this.stats.totalWon += result.reward;
    this.stats.biggestWin = Math.max(this.stats.biggestWin, result.reward);

    if (result.reward > 0) {
      this.stats.wins += 1;
      this.updateRadiance(result.type === "special" || result.type === "trio" ? 24 : 12);
      this.setMessage(`${result.title}: ${result.label}`);
      this.elements.fortuneAmount.textContent = `+${result.reward} credits`;
      this.elements.gardenState.textContent = result.title;
      this.highlightWinningSymbols(result, centerLine);
      this.flashReelWindow();
      this.celebrateCabinet(result.type);
      this.motion.emitSparks(1, result.type === "special" || result.type === "trio" ? 16 : 8);
    } else {
      this.updateRadiance(-7);
      this.setMessage(result.label);
      this.elements.fortuneAmount.textContent = "Quiet turn";
      this.elements.gardenState.textContent = "Stillness";
    }

    this.sound.result(result.type);
    this.updateReadouts();
  }

  highlightWinningSymbols(result, centerLine) {
    this.elements.reelWindow.classList.toggle("has-line-win", result.reward > 0);

    this.reels.strips.forEach((strip, reelIndex) => {
      const cards = Array.from(strip.reelElement.querySelectorAll(".symbol-card"));
      const visibleCards = cards.slice(strip.currentIndex - 1, strip.currentIndex + 2);
      const centerSymbol = centerLine[reelIndex];

      visibleCards.forEach((card, rowIndex) => {
        if (rowIndex === 1 && result.winningIds.has(centerSymbol.id)) {
          card.classList.add("is-winning");
        }
      });
    });
  }

  clearWinningState() {
    this.elements.reelWindow.classList.remove("is-win", "has-line-win");
    document.querySelectorAll(".symbol-card.is-winning").forEach((card) => {
      card.classList.remove("is-winning");
    });
  }

  createSymbolCard(symbol) {
    const fragment = this.elements.symbolTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".symbol-card");
    const inner = fragment.querySelector(".symbol-card__inner");
    const art = fragment.querySelector(".symbol-card__art");
    const name = fragment.querySelector(".symbol-card__name");
    const image = document.createElement("img");

    inner.style.setProperty("--symbol-glow", symbol.glow);
    image.src = symbol.assetPath;
    image.alt = "";
    image.loading = "eager";
    image.decoding = "async";
    art.appendChild(image);
    name.textContent = symbol.name;
    card.dataset.symbolId = symbol.id;

    return fragment;
  }

  populatePaytable() {
    this.elements.paytableList.replaceChildren(...SYMBOLS.map((symbol) => {
      const row = document.createElement("li");
      row.className = "paytable-row";
      row.innerHTML = `
        <img src="${symbol.assetPath}" alt="" />
        <span>${symbol.name}</span>
        <strong>${symbol.payout3}</strong>
        <em>${symbol.payout2}</em>
      `;
      return row;
    }));

    this.elements.patternList.replaceChildren(...SPECIAL_PATTERNS.map((pattern) => {
      const row = document.createElement("li");
      row.className = "pattern-row";
      row.innerHTML = `
        <span>${pattern.title}</span>
        <em>${pattern.description}</em>
        <strong>${pattern.reward}</strong>
      `;
      return row;
    }));
  }

  populateAmbientParticles() {
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

    this.elements.ambientParticles.replaceChildren(fragment);
  }

  openPaytable() {
    this.elements.paytableModal.classList.add("is-open");
    this.elements.paytableModal.setAttribute("aria-hidden", "false");
    this.elements.closePaytable.focus();
  }

  closePaytable() {
    this.elements.paytableModal.classList.remove("is-open");
    this.elements.paytableModal.setAttribute("aria-hidden", "true");
  }

  toggleSound() {
    const enabled = this.elements.soundToggle.getAttribute("aria-pressed") !== "true";
    this.elements.soundToggle.setAttribute("aria-pressed", String(enabled));
    this.elements.soundToggle.textContent = enabled ? "Sound aglow" : "Sound quiet";
    this.sound.setEnabled(enabled);
    this.setMessage(enabled
      ? "The cabinet murmurs with soft brass clicks and lantern chimes."
      : "The cabinet falls back to lantern hush.");
  }

  resetSession() {
    this.credits = GAME_RULES.startingCredits;
    this.stats = { spins: 0, wins: 0, totalWon: 0, biggestWin: 0 };
    this.radiance = 0;
    this.updateRadiance(14);
    this.clearWinningState();
    this.setMessage("A fresh fictional-credit session blooms in the cabinet.");
    this.elements.fortuneAmount.textContent = "Session reset";
    this.elements.gardenState.textContent = this.awakened ? "Ready" : "Stillness";
    this.elements.spinButton.disabled = !this.awakened;
    this.updateReadouts();
  }

  updateReadouts() {
    this.elements.creditAmount.textContent = this.credits.toLocaleString();
    this.elements.statSpins.textContent = this.stats.spins.toLocaleString();
    this.elements.statWins.textContent = this.stats.wins.toLocaleString();
    this.elements.statBest.textContent = this.stats.biggestWin.toLocaleString();
  }

  updateRadiance(delta) {
    this.radiance = clamp(this.radiance + delta, 10, 100);
    this.elements.radianceFill.style.width = `${this.radiance}%`;
    this.elements.radianceFill.style.boxShadow = `0 0 ${0.3 + this.radiance / 28}rem rgba(247, 214, 121, 0.34)`;
  }

  flashReelWindow() {
    this.elements.reelWindow.classList.remove("is-win");
    void this.elements.reelWindow.offsetWidth;
    this.elements.reelWindow.classList.add("is-win");
  }

  celebrateCabinet(resultType) {
    this.elements.cabinet.classList.remove("is-celebrating", "is-major-win");
    void this.elements.cabinet.offsetWidth;
    this.elements.cabinet.classList.add("is-celebrating");
    if (resultType === "special" || resultType === "trio") {
      this.elements.cabinet.classList.add("is-major-win");
    }
    window.setTimeout(() => {
      this.elements.cabinet.classList.remove("is-celebrating", "is-major-win");
    }, 1240);
  }

  setMessage(message) {
    this.elements.statusRibbon.textContent = message;
  }

  getMetrics() {
    const styles = window.getComputedStyle(document.documentElement);
    return {
      cardHeightRem: Number.parseFloat(styles.getPropertyValue("--card-height")),
      cardGapRem: Number.parseFloat(styles.getPropertyValue("--card-gap"))
    };
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
