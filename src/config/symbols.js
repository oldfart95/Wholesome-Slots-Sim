export const SYMBOLS = [
  {
    id: "clover",
    name: "Clover",
    tier: "garden",
    weight: 26,
    payout3: 12,
    payout2: 4,
    glow: "rgba(177, 227, 132, 0.34)",
    assetPath: "assets/symbols/clover-medallion.svg",
    note: "A soft garden favorite with steady fortune."
  },
  {
    id: "dew-gem",
    name: "Dew Gem",
    tier: "garden",
    weight: 22,
    payout3: 14,
    payout2: 5,
    glow: "rgba(146, 223, 240, 0.3)",
    assetPath: "assets/symbols/dew-drop-medallion.svg",
    note: "Clear, bright, and easy to catch in morning light."
  },
  {
    id: "ivy-knot",
    name: "Ivy Knot",
    tier: "garden",
    weight: 18,
    payout3: 18,
    payout2: 6,
    glow: "rgba(110, 184, 121, 0.28)",
    assetPath: "assets/symbols/ivy-knot-medallion.svg",
    note: "A woven emblem for paired leaves and gentle ties."
  },
  {
    id: "rose",
    name: "Rose",
    tier: "ornate",
    weight: 16,
    payout3: 20,
    payout2: 7,
    glow: "rgba(243, 190, 173, 0.28)",
    assetPath: "assets/symbols/rose-medallion.svg",
    note: "Polished lacquer petals with a warm blush."
  },
  {
    id: "lantern",
    name: "Lantern",
    tier: "rare",
    weight: 13,
    payout3: 28,
    payout2: 9,
    glow: "rgba(245, 214, 124, 0.34)",
    assetPath: "assets/symbols/lantern-medallion.svg",
    note: "Amber glass that lights the center line."
  },
  {
    id: "moonleaf",
    name: "Moonleaf",
    tier: "rare",
    weight: 11,
    payout3: 30,
    payout2: 10,
    glow: "rgba(196, 223, 145, 0.3)",
    assetPath: "assets/symbols/moonleaf-medallion.svg",
    note: "A silver-green leaf for quiet nocturne turns."
  },
  {
    id: "golden-key",
    name: "Golden Key",
    tier: "rare",
    weight: 9,
    payout3: 36,
    payout2: 12,
    glow: "rgba(247, 214, 121, 0.38)",
    assetPath: "assets/symbols/golden-key-medallion.svg",
    note: "Unlocks special lantern patterns."
  },
  {
    id: "sunburst",
    name: "Sunburst",
    tier: "crown",
    weight: 8,
    payout3: 42,
    payout2: 14,
    glow: "rgba(255, 219, 121, 0.38)",
    assetPath: "assets/symbols/sunburst-medallion.svg",
    note: "A bright brass seal with high-table polish."
  },
  {
    id: "bird",
    name: "Goldfinch",
    tier: "crown",
    weight: 7,
    payout3: 48,
    payout2: 16,
    glow: "rgba(255, 231, 148, 0.34)",
    assetPath: "assets/symbols/bird-medallion.svg",
    note: "A small herald of rare garden music."
  },
  {
    id: "crown",
    name: "Crown",
    tier: "crown",
    weight: 6,
    payout3: 60,
    payout2: 20,
    glow: "rgba(255, 230, 145, 0.42)",
    assetPath: "assets/symbols/crown-medallion.svg",
    note: "The highest cabinet crest."
  }
];

export const SYMBOL_LOOKUP = new Map(SYMBOLS.map((symbol) => [symbol.id, symbol]));
