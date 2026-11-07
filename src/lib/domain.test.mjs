import assert from "node:assert/strict";
import test from "node:test";
import { calculateFeasibility, demoParcels, searchParcels } from "./domain.ts";

test("demo provider yields 100 clearly fictional parcel records", () => {
  assert.equal(demoParcels.length, 100);
  assert.equal(new Set(demoParcels.map((parcel) => parcel.id)).size, 100);
  assert.ok(demoParcels.every((parcel) => parcel.apn.startsWith("DEMO-")));
  assert.ok(demoParcels.every((parcel) => parcel.address.startsWith("Demonstration site")));
  assert.ok(demoParcels.every((parcel) => parcel.score >= 0 && parcel.score <= 100));
  assert.ok(demoParcels.every((parcel) => {
    const expected = Math.round(
      0.3 * parcel.parcelSizeScore +
      0.27 * parcel.housingNeed +
      0.2 * parcel.transit +
      0.13 * parcel.infrastructure +
      0.1 * parcel.constraintScore,
    );
    return parcel.score === Math.max(28, Math.min(96, expected));
  }));
});

test("parcel search matches APN, generated site label, city, and category", () => {
  assert.equal(searchParcels("DEMO-00001").length, 1);
  assert.equal(searchParcels("Demonstration site 001").length, 1);
  assert.ok(searchParcels("Los Angeles").length > 0);
  assert.ok(searchParcels("Vacant land", "Vacant land").every((parcel) => parcel.category === "Vacant land"));
  assert.equal(searchParcels("no-such-site").length, 0);
});

test("feasibility capacity uses the tighter density and floor-area cap", () => {
  const result = calculateFeasibility({
    parcelAreaSqFt: 43560,
    densityUnitsPerAcre: 20,
    netToGross: 0.8,
    constructionCostPerSqFt: 350,
    landCostPerSqFt: 50,
    monthlyRentPerUnit: 2000,
    unitSizeSqFt: 700,
    affordableSharePct: 25,
  });
  assert.equal(result.units, 20);
  assert.equal(result.grossFloorAreaSqFt, 14000);
  assert.equal(result.landAcquisition, 2178000);
  assert.equal(result.hardCosts, 4900000);
  assert.equal(result.softCosts, 1078000);
  assert.equal(result.contingency, 392000);
  assert.equal(result.financing, 445900);
  assert.equal(result.totalDevelopmentCost, 8993900);
  assert.equal(result.annualGrossRent, 480000);
  assert.equal(result.annualNetOperatingIncome, 297600);
  assert.equal(result.affordableUnits, 5);
});

test("feasibility output is deterministic and safe for zero area", () => {
  const input = { parcelAreaSqFt: 0, densityUnitsPerAcre: 40, netToGross: 0.8, constructionCostPerSqFt: 300, landCostPerSqFt: 30, monthlyRentPerUnit: 2000, unitSizeSqFt: 750, affordableSharePct: 30 };
  assert.deepEqual(calculateFeasibility(input), calculateFeasibility(input));
  assert.equal(calculateFeasibility(input).units, 0);
  assert.equal(calculateFeasibility(input).totalDevelopmentCost, 0);
  assert.equal(calculateFeasibility(input).yieldOnCost, 0);
});

test("feasibility remains finite when an edited unit size is zero", () => {
  const result = calculateFeasibility({ parcelAreaSqFt: 10000, densityUnitsPerAcre: 40, netToGross: 0.8, constructionCostPerSqFt: 300, landCostPerSqFt: 30, monthlyRentPerUnit: 2000, unitSizeSqFt: 0, affordableSharePct: 160 });
  assert.equal(result.units, 0);
  assert.equal(result.affordableUnits, 0);
  assert.ok(Object.values(result).every(Number.isFinite));
});
