export type OpportunityCategory =
  | "Vacant land"
  | "Underutilized residential"
  | "Commercial reuse"
  | "Small multifamily"
  | "Transit-oriented"
  | "Public land"
  | "ADU potential"
  | "Mixed-use"
  | "Parking / commercial site"
  | "Locally identified";

export type DemoParcel = {
  id: string;
  apn: string;
  address: string;
  city: string;
  county: string;
  state: string;
  areaSqFt: number;
  assessedValue: number;
  landUse: string;
  zoning: string;
  category: OpportunityCategory;
  score: number;
  parcelSizeScore: number;
  confidence: "High" | "Medium" | "Low";
  units: number;
  lat: number;
  lng: number;
  transit: number;
  housingNeed: number;
  infrastructure: number;
  constraintScore: number;
  constraints: string[];
};

export const DEMO_NOTICE = "DEMONSTRATION DATA — NOT VERIFIED PROPERTY INFORMATION";
export const demoJurisdictions = [
  { name: "Los Angeles County", jurisdictionType: "county", state: "CA", dataReadiness: "synthetic demo sample" },
  { name: "Riverside County", jurisdictionType: "county", state: "CA", dataReadiness: "unverified" },
  { name: "San Bernardino County", jurisdictionType: "county", state: "CA", dataReadiness: "unverified" },
  { name: "San Diego County", jurisdictionType: "county", state: "CA", dataReadiness: "unverified" },
  { name: "Orange County", jurisdictionType: "county", state: "CA", dataReadiness: "unverified" },
];
export const demoRegionalIndicators = [
  { name: "Los Angeles County", score: 74, sites: 100, demand: 82 },
  { name: "Riverside County", score: 68, sites: 0, demand: 77 },
  { name: "San Bernardino County", score: 65, sites: 0, demand: 70 },
  { name: "Orange County", score: 61, sites: 0, demand: 69 },
  { name: "San Diego County", score: 66, sites: 0, demand: 73 },
];

const categories: OpportunityCategory[] = [
  "Vacant land",
  "Underutilized residential",
  "Commercial reuse",
  "Small multifamily",
  "Transit-oriented",
  "Public land",
  "ADU potential",
  "Mixed-use",
  "Parking / commercial site",
  "Locally identified",
];
const zoningLabels = ["R-3 · demo", "C-2 · demo", "MU · demo", "R-2 · demo", "P · demo"];
const cities = ["Los Angeles", "Long Beach", "Pasadena", "Inglewood", "Pomona"];

function sample(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export const demoParcels: DemoParcel[] = Array.from({ length: 100 }, (_, index) => {
  const i = index + 1;
  const areaSqFt = Math.round(4500 + sample(i, 1) * 66000);
  const transit = Math.round(30 + sample(i, 2) * 68);
  const housingNeed = Math.round(38 + sample(i, 3) * 58);
  const infrastructure = Math.round(48 + sample(i, 4) * 48);
  const parcelSizeScore = Math.min(100, Math.round(areaSqFt / 550));
  const constraints = [
    sample(i, 6) > 0.72 ? "Environmental screening required" : "No demo environmental flag",
    sample(i, 7) > 0.68 ? "Utility capacity unverified" : "Street access indicator present",
  ];
  const constraintFlags = constraints.filter((item) => item.includes("required") || item.includes("unverified")).length;
  const constraintScore = Math.max(40, 100 - constraintFlags * 20);
  const parcelScore = Math.round(
    0.3 * parcelSizeScore +
      0.27 * housingNeed +
      0.2 * transit +
      0.13 * infrastructure +
      0.1 * constraintScore,
  );
  return {
    id: `demo-${String(i).padStart(3, "0")}`,
    apn: `DEMO-${String(i).padStart(5, "0")}`,
    address: `Demonstration site ${String(i).padStart(3, "0")}`,
    city: cities[Math.floor(sample(i, 8) * cities.length)],
    county: "Los Angeles",
    state: "CA",
    areaSqFt,
    assessedValue: Math.round(areaSqFt * (18 + sample(i, 9) * 44)),
    landUse: ["Vacant / demo", "Commercial / demo", "Residential / demo", "Parking / demo"][Math.floor(sample(i, 10) * 4)],
    zoning: zoningLabels[Math.floor(sample(i, 11) * zoningLabels.length)],
    category: categories[Math.floor(sample(i, 12) * categories.length)],
    score: Math.max(28, Math.min(96, parcelScore)),
    parcelSizeScore,
    confidence: sample(i, 13) > 0.72 ? "High" : sample(i, 13) > 0.33 ? "Medium" : "Low",
    units: Math.max(4, Math.floor((areaSqFt / 43560) * (28 + sample(i, 14) * 58))),
    lat: 33.72 + sample(i, 15) * 0.66,
    lng: -118.58 + sample(i, 16) * 0.82,
    transit,
    housingNeed,
    infrastructure,
    constraintScore,
    constraints,
  };
});

export const demoDataSources = [
  { name: "Synthetic parcel inventory", type: "Parcel records", status: "Demo provider", updated: "On page load", note: "100 generated sites; no real APNs or boundaries." },
  { name: "Sample zoning library", type: "Zoning documents", status: "Demo provider", updated: "Version 0.1", note: "Fictional excerpts for interface demonstration only." },
  { name: "Housing need indicators", type: "Housing indicators", status: "Demo provider", updated: "Synthetic", note: "Relative demo scores; not official estimates." },
  { name: "Environmental screen flags", type: "Environmental", status: "Demo provider", updated: "Synthetic", note: "Screening placeholders; not a site assessment." },
];

export const demoHousingIndicators = Array.from(new Set(demoParcels.map((parcel) => parcel.city))).map((city) => {
  const records = demoParcels.filter((parcel) => parcel.city === city);
  return {
    geography: city,
    indicator: "relative_housing_need_demo_score",
    value: Math.round(records.reduce((sum, parcel) => sum + parcel.housingNeed, 0) / records.length),
    unit: "synthetic relative index (0–100)",
    recordCount: records.length,
    sourceClassification: "synthetic demonstration",
  };
});

export function searchParcels(query: string, category?: string) {
  const q = query.trim().toLowerCase();
  return demoParcels.filter((parcel) => {
    const matchesQuery = !q || [parcel.id, parcel.apn, parcel.address, parcel.city, parcel.category].some((v) => v.toLowerCase().includes(q));
    const matchesCategory = !category || category === "All opportunities" || parcel.category === category;
    return matchesQuery && matchesCategory;
  });
}

export type FeasibilityInputs = {
  parcelAreaSqFt: number;
  densityUnitsPerAcre: number;
  netToGross: number;
  constructionCostPerSqFt: number;
  landCostPerSqFt: number;
  monthlyRentPerUnit: number;
  unitSizeSqFt: number;
  affordableSharePct: number;
};

export type FeasibilityResult = {
  units: number;
  grossFloorAreaSqFt: number;
  landAcquisition: number;
  hardCosts: number;
  softCosts: number;
  contingency: number;
  financing: number;
  totalDevelopmentCost: number;
  annualGrossRent: number;
  annualNetOperatingIncome: number;
  yieldOnCost: number;
  affordableUnits: number;
  affordableMonthlyRent: number;
};

export const defaultFeasibilityInputs: FeasibilityInputs = {
  parcelAreaSqFt: 32000,
  densityUnitsPerAcre: 48,
  netToGross: 0.82,
  constructionCostPerSqFt: 340,
  landCostPerSqFt: 48,
  monthlyRentPerUnit: 2450,
  unitSizeSqFt: 760,
  affordableSharePct: 25,
};

export function calculateFeasibility(input: FeasibilityInputs): FeasibilityResult {
  const safe = (value: number, fallback = 0) => Number.isFinite(value) ? Math.max(0, value) : fallback;
  const parcelAreaSqFt = safe(input.parcelAreaSqFt);
  const densityUnitsPerAcre = safe(input.densityUnitsPerAcre);
  const netToGross = Math.min(1, safe(input.netToGross));
  const unitSizeSqFt = safe(input.unitSizeSqFt);
  const constructionCostPerSqFt = safe(input.constructionCostPerSqFt);
  const landCostPerSqFt = safe(input.landCostPerSqFt);
  const monthlyRentPerUnit = safe(input.monthlyRentPerUnit);
  const affordableSharePct = Math.min(100, safe(input.affordableSharePct));
  const acreCap = Math.floor((parcelAreaSqFt / 43560) * densityUnitsPerAcre);
  const areaCap = unitSizeSqFt > 0 ? Math.floor((parcelAreaSqFt * netToGross) / unitSizeSqFt) : 0;
  const units = Math.max(0, Math.min(acreCap, areaCap));
  const grossFloorAreaSqFt = units * unitSizeSqFt;
  const landAcquisition = Math.round(parcelAreaSqFt * landCostPerSqFt);
  const hardCosts = Math.round(grossFloorAreaSqFt * constructionCostPerSqFt);
  const softCosts = Math.round(hardCosts * 0.22);
  const contingency = Math.round(hardCosts * 0.08);
  const financing = Math.round((hardCosts + softCosts + contingency) * 0.07);
  const totalDevelopmentCost = landAcquisition + hardCosts + softCosts + contingency + financing;
  const annualGrossRent = units * monthlyRentPerUnit * 12;
  const annualNetOperatingIncome = Math.round(annualGrossRent * 0.62);
  const affordableUnits = Math.round(units * affordableSharePct / 100);
  return {
    units,
    grossFloorAreaSqFt,
    landAcquisition,
    hardCosts,
    softCosts,
    contingency,
    financing,
    totalDevelopmentCost,
    annualGrossRent,
    annualNetOperatingIncome,
    yieldOnCost: totalDevelopmentCost ? annualNetOperatingIncome / totalDevelopmentCost * 100 : 0,
    affordableUnits,
    affordableMonthlyRent: Math.round(monthlyRentPerUnit * 0.7),
  };
}

export const demoZoningEvidence = [
  {
    title: "Demonstration zoning excerpt · Housing district",
    citation: "Fictional sample document · section 4.2 · page 11",
    text: "This fictional demonstration excerpt illustrates how a zoning research result may be presented. It does not describe an adopted rule or an actual jurisdiction.",
  },
  {
    title: "Demonstration land use schedule",
    citation: "Fictional sample document · table 2 · page 6",
    text: "The sample interface records source title, version, page, and excerpt so reviewers can inspect evidence and confirm current official requirements.",
  },
];

export function answerDemoQuestion(question: string) {
  if (!question.trim()) return "Enter a zoning question to search the demonstration document library.";
  return `I found two demonstration excerpts that illustrate the research workflow for “${question.trim()}”. The excerpts are fictional and do not establish permitted uses, density, setbacks, or entitlement. Verify the current adopted code with the relevant planning department before making a site decision.`;
}

export function currency(value: number, compact = false) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    ...(compact ? { notation: "compact" as const, compactDisplay: "short" as const } : {}),
  }).format(value);
}

