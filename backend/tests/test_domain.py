import unittest
import math

from app.domain import DEMO_PARCELS, calculate_feasibility, search_parcels


class DemoDomainTests(unittest.TestCase):
    def test_seed_contains_only_explicit_demo_records(self):
        self.assertEqual(len(DEMO_PARCELS), 100)
        self.assertEqual(len({parcel["id"] for parcel in DEMO_PARCELS}), 100)
        self.assertTrue(all(parcel["apn"].startswith("DEMO-") for parcel in DEMO_PARCELS))
        self.assertTrue(all(0 <= parcel["score"] <= 100 for parcel in DEMO_PARCELS))
        for parcel in DEMO_PARCELS:
            expected = math.floor(0.30 * parcel["parcelSizeScore"] + 0.27 * parcel["housingNeed"] + 0.20 * parcel["transit"] + 0.13 * parcel["infrastructure"] + 0.10 * parcel["constraintScore"] + 0.5)
            self.assertEqual(parcel["score"], max(28, min(96, expected)))

    def test_search_filters_by_apn_and_category(self):
        self.assertEqual(len(search_parcels("DEMO-00001")), 1)
        matches = search_parcels("", "Vacant land")
        self.assertGreater(len(matches), 0)
        self.assertTrue(all(parcel["category"] == "Vacant land" for parcel in matches))

    def test_feasibility_capacity_and_costs_are_deterministic(self):
        inputs = {
            "parcelAreaSqFt": 43560,
            "densityUnitsPerAcre": 20,
            "netToGross": 0.8,
            "constructionCostPerSqFt": 350,
            "landCostPerSqFt": 50,
            "monthlyRentPerUnit": 2000,
            "unitSizeSqFt": 700,
            "affordableSharePct": 25,
        }
        result = calculate_feasibility(inputs)
        self.assertEqual(result["units"], 20)
        self.assertEqual(result["totalDevelopmentCost"], 8993900)
        self.assertEqual(result["annualNetOperatingIncome"], 297600)
        self.assertEqual(result["affordableUnits"], 5)
        self.assertEqual(result, calculate_feasibility(inputs))


if __name__ == "__main__":
    unittest.main()
