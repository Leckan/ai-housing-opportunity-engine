import assert from "node:assert/strict";
import test from "node:test";
import { chatRequestSchema, feasibilityRequestSchema, parcelListQuerySchema, reportRequestSchema } from "./api-schemas.ts";

test("parcel list query supplies bounded pagination defaults", () => {
  const defaults = parcelListQuerySchema.parse({});
  assert.deepEqual({ q: defaults.q, page: defaults.page, pageSize: defaults.pageSize }, { q: "", page: 1, pageSize: 25 });
  assert.equal(parcelListQuerySchema.safeParse({ pageSize: "101" }).success, false);
});

test("assistant request trims text and rejects empty or oversized content", () => {
  assert.equal(chatRequestSchema.parse({ message: "  hello  " }).message, "hello");
  assert.equal(chatRequestSchema.safeParse({ message: "   " }).success, false);
  assert.equal(chatRequestSchema.safeParse({ message: "x".repeat(2001) }).success, false);
});

test("feasibility schema rejects invalid efficiency and unit size", () => {
  assert.equal(feasibilityRequestSchema.safeParse({ netToGross: 1.1 }).success, false);
  assert.equal(feasibilityRequestSchema.safeParse({ unitSizeSqFt: 0 }).success, false);
  assert.equal(feasibilityRequestSchema.safeParse({ affordableSharePct: 50 }).success, true);
});

test("report schema accepts only supported formats", () => {
  assert.equal(reportRequestSchema.parse({ parcelId: "demo-001" }).format, "json");
  assert.equal(reportRequestSchema.parse({ parcelId: "demo-001", format: "csv" }).format, "csv");
  assert.equal(reportRequestSchema.safeParse({ parcelId: "demo-001", format: "pdf" }).success, false);
});
