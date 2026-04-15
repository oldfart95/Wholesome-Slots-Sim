import { SYMBOLS } from "../config/symbols.js";

const STRIP_REPEAT = 7;

export class ReelEngine {
  constructor({ reelCount = 3 } = {}) {
    this.reelCount = reelCount;
    this.strips = Array.from({ length: reelCount }, (_, index) => this.createStrip(index));
  }

  createStrip(reelIndex) {
    const rotation = reelIndex * 3;
    const rotated = [...SYMBOLS.slice(rotation), ...SYMBOLS.slice(0, rotation)];
    const baseSymbols = [
      ...rotated,
      rotated[1],
      rotated[4],
      rotated[2],
      rotated[6],
      rotated[0],
      rotated[8 % rotated.length]
    ];
    const repeatedSymbols = Array.from({ length: STRIP_REPEAT }, () => baseSymbols).flat();
    const startIndex = baseSymbols.length * Math.floor(STRIP_REPEAT / 2);

    return {
      baseSymbols,
      repeatedSymbols,
      currentIndex: startIndex
    };
  }

  getInitialWindows() {
    return this.strips.map((strip) => this.getVisibleWindow(strip, strip.currentIndex));
  }

  createSpinPlan() {
    return this.strips.map((strip, reelIndex) => {
      const stopSymbol = weightedPick(SYMBOLS);
      const minimumIndex = strip.currentIndex + strip.baseSymbols.length * (2 + reelIndex);
      return {
        stopSymbol,
        stopIndex: findCenteredSymbolIndex(strip, stopSymbol.id, minimumIndex)
      };
    });
  }

  commitStop(reelIndex, stopIndex) {
    const strip = this.strips[reelIndex];
    strip.currentIndex = stopIndex;
    return this.getVisibleWindow(strip, stopIndex);
  }

  normalize(reelIndex) {
    const strip = this.strips[reelIndex];
    const normalizedIndex = strip.baseSymbols.length * Math.floor(STRIP_REPEAT / 2)
      + (strip.currentIndex % strip.baseSymbols.length);
    strip.currentIndex = normalizedIndex;
    return normalizedIndex;
  }

  getVisibleWindow(strip, centerIndex) {
    return strip.repeatedSymbols.slice(centerIndex - 1, centerIndex + 2);
  }
}

export function calculateTranslate(centerIndex, metrics) {
  return -(centerIndex * (metrics.cardHeightRem + metrics.cardGapRem));
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

function findCenteredSymbolIndex(strip, symbolId, minimumIndex) {
  for (let index = Math.max(1, Math.floor(minimumIndex)); index < strip.repeatedSymbols.length - 1; index += 1) {
    if (strip.repeatedSymbols[index].id === symbolId) {
      return index;
    }
  }

  return strip.repeatedSymbols.findIndex((symbol, index) => {
    return symbol.id === symbolId && index > 0 && index < strip.repeatedSymbols.length - 1;
  });
}
