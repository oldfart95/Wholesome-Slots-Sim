import { SYMBOLS } from "./symbols.js";

export const GAME_RULES = {
  startingCredits: 2500,
  betPerSpin: 25,
  minCredits: 0,
  lineName: "Lantern Line"
};

export const SPECIAL_PATTERNS = [
  {
    id: "lantern-key",
    title: "Lantern Keyway",
    description: "Lantern + Golden Key + any crown-tier symbol",
    reward: 90,
    matches(ids, centerLine) {
      return ids.includes("lantern")
        && ids.includes("golden-key")
        && centerLine.some((symbol) => symbol.tier === "crown");
    }
  },
  {
    id: "moon-dew-clover",
    title: "Moonlit Clover",
    description: "Moonleaf + Dew Gem + Clover",
    reward: 70,
    matches(ids) {
      return ids.includes("moonleaf") && ids.includes("dew-gem") && ids.includes("clover");
    }
  },
  {
    id: "royal-garden",
    title: "Royal Garden",
    description: "Crown + Rose + Sunburst",
    reward: 85,
    matches(ids) {
      return ids.includes("crown") && ids.includes("rose") && ids.includes("sunburst");
    }
  },
  {
    id: "clover-weave",
    title: "Clover Weave",
    description: "Two Clovers + Ivy Knot",
    reward: 55,
    matches(ids) {
      return ids.filter((id) => id === "clover").length === 2 && ids.includes("ivy-knot");
    }
  }
];

export function evaluateCenterLine(centerLine) {
  const ids = centerLine.map((symbol) => symbol.id);
  const special = SPECIAL_PATTERNS.find((pattern) => pattern.matches(ids, centerLine));

  if (special) {
    return {
      type: "special",
      title: special.title,
      label: special.description,
      reward: special.reward,
      winningIds: new Set(ids)
    };
  }

  const [first, second, third] = centerLine;

  if (first.id === second.id && second.id === third.id) {
    return {
      type: "trio",
      title: `${first.name} Trio`,
      label: `Three ${first.name} emblems bloomed on the ${GAME_RULES.lineName}.`,
      reward: first.payout3,
      winningIds: new Set([first.id])
    };
  }

  const counts = centerLine.reduce((map, symbol) => {
    map.set(symbol.id, (map.get(symbol.id) || 0) + 1);
    return map;
  }, new Map());
  const pairId = [...counts.entries()].find(([, count]) => count === 2)?.[0];

  if (pairId) {
    const pairSymbol = SYMBOLS.find((symbol) => symbol.id === pairId);
    return {
      type: "pair",
      title: `${pairSymbol.name} Pair`,
      label: `Two ${pairSymbol.name} emblems settled together.`,
      reward: pairSymbol.payout2,
      winningIds: new Set([pairId])
    };
  }

  const rareCount = centerLine.filter((symbol) => symbol.tier === "rare" || symbol.tier === "crown").length;

  if (rareCount >= 2) {
    return {
      type: "glimmer",
      title: "Rare Glimmer",
      label: "Rare ornaments crossed the line and left a small glow.",
      reward: 6,
      winningIds: new Set(ids.filter((id) => {
        const symbol = SYMBOLS.find((item) => item.id === id);
        return symbol.tier === "rare" || symbol.tier === "crown";
      }))
    };
  }

  return {
    type: "miss",
    title: "Quiet Turn",
    label: "The garden exhales and returns to a gentle hush.",
    reward: 0,
    winningIds: new Set()
  };
}
