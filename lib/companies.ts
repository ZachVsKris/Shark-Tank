export type Company = {
  id: string;
  name: string;
  tagline: string;
  askCash: number;
  askEquity: number;
  founderMaxEquity: number;
  summary: string;
  facts: Record<string, string>;
  qa: [string, string][];
  outcome: {
    value: number;
    note: string;
  };
};

export const COMPANIES: Company[] = [
  {
    id: "meal-mate",
    name: "MealMate",
    tagline: "A compact meal-prep container system",
    askCash: 150000,
    askEquity: 10,
    founderMaxEquity: 24,
    summary: "A modular container system designed for portion control and easy transport.",
    facts: {
      "Lifetime sales": "$620K",
      "Trailing revenue": "$410K",
      "Gross margin": "68%",
      "Distribution": "DTC and 80 retail stores"
    },
    qa: [
      ["What does one unit cost to make?", "$8.40 landed"],
      ["What is the average selling price?", "$34"],
      ["Is it patented?", "Design patent issued"],
      ["Why raise money?", "Inventory and retail expansion"]
    ],
    outcome: {
      value: 18000000,
      note: "A later financing implied an $18M valuation."
    }
  },
  {
    id: "trail-light",
    name: "TrailLight",
    tagline: "Rechargeable lighting for hikers and campers",
    askCash: 250000,
    askEquity: 8,
    founderMaxEquity: 18,
    summary: "A lightweight lantern and emergency charging system for outdoor use.",
    facts: {
      "Lifetime sales": "$1.2M",
      "Trailing revenue": "$760K",
      "Gross margin": "61%",
      "Distribution": "Online and outdoor retail"
    },
    qa: [
      ["Customer acquisition cost?", "$27"],
      ["Average order value?", "$89"],
      ["Profitable?", "Slightly profitable"],
      ["Main risk?", "Inventory-heavy growth"]
    ],
    outcome: {
      value: 32000000,
      note: "The company was later acquired for a reported $32M."
    }
  },
  {
    id: "splash-safe",
    name: "SplashSafe",
    tagline: "A reusable child water-safety wearable",
    askCash: 100000,
    askEquity: 12,
    founderMaxEquity: 28,
    summary: "A brightly colored wearable intended to improve child visibility around water.",
    facts: {
      "Lifetime sales": "$190K",
      "Trailing revenue": "$120K",
      "Gross margin": "74%",
      "Distribution": "Online only"
    },
    qa: [
      ["Patent protection?", "Utility patent pending"],
      ["Repeat purchase rate?", "Low"],
      ["Retail interest?", "Two pilot conversations"],
      ["Founder background?", "Former swim instructor"]
    ],
    outcome: {
      value: 0,
      note: "The company later ceased operations."
    }
  },
  {
    id: "quiet-cup",
    name: "QuietCup",
    tagline: "A spill-resistant travel mug lid",
    askCash: 180000,
    askEquity: 15,
    founderMaxEquity: 30,
    summary: "A redesigned lid intended to reduce spills and drinking noise.",
    facts: {
      "Lifetime sales": "$870K",
      "Trailing revenue": "$540K",
      "Gross margin": "72%",
      "Distribution": "Amazon and regional grocery"
    },
    qa: [
      ["Retail sell-through?", "Strong in top stores"],
      ["Manufacturing location?", "Domestic contract manufacturer"],
      ["Licensing interest?", "One preliminary inquiry"],
      ["Inventory on hand?", "$210K at cost"]
    ],
    outcome: {
      value: 11000000,
      note: "A later disclosed round implied an $11M valuation."
    }
  },
  {
    id: "pet-patch",
    name: "PetPatch",
    tagline: "A subscription wellness patch for dogs",
    askCash: 300000,
    askEquity: 10,
    founderMaxEquity: 22,
    summary: "A monthly pet wellness product sold through subscriptions and veterinary partners.",
    facts: {
      "Lifetime sales": "$2.1M",
      "Trailing revenue": "$1.4M",
      "Gross margin": "58%",
      "Recurring revenue": "72%"
    },
    qa: [
      ["Monthly churn?", "6.5%"],
      ["Veterinary distribution?", "42 clinics"],
      ["Regulatory concerns?", "Non-medicated wellness product"],
      ["Use of funds?", "Sales team and inventory"]
    ],
    outcome: {
      value: 45000000,
      note: "A later institutional round implied a $45M valuation."
    }
  },
  {
    id: "desk-garden",
    name: "DeskGarden",
    tagline: "A self-watering desktop planter",
    askCash: 125000,
    askEquity: 15,
    founderMaxEquity: 26,
    summary: "A small self-watering planter designed for offices and apartments.",
    facts: {
      "Lifetime sales": "$340K",
      "Trailing revenue": "$230K",
      "Gross margin": "64%",
      "Corporate gifting": "30% of revenue"
    },
    qa: [
      ["Seasonality?", "Holiday-heavy"],
      ["Return rate?", "4.2%"],
      ["Main channel?", "Direct-to-consumer"],
      ["Competition?", "Crowded but fragmented"]
    ],
    outcome: {
      value: 9000000,
      note: "The company was later acquired for a reported $9M."
    }
  }
];

export function randomizedCompanyIds() {
  return [...COMPANIES]
    .sort(() => Math.random() - 0.5)
    .map((company) => company.id);
}

export function findCompany(id: string | undefined | null) {
  return COMPANIES.find((company) => company.id === id) || null;
}
