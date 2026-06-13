import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { FoodResult } from "@/lib/types";

async function searchOpenFoodFacts(query: string): Promise<FoodResult[]> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=8&fields=code,product_name,brands,nutriments`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (
      (data.products ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((p: any) => p.product_name && p.nutriments?.["energy-kcal_100g"])
        .slice(0, 5)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((p: any) => ({
          id: `off-${p.code}`,
          name: p.product_name,
          brand: p.brands || undefined,
          per100g: {
            calories: Math.round(p.nutriments["energy-kcal_100g"] ?? 0),
            protein: Math.round(p.nutriments["proteins_100g"] ?? 0),
            carbs: Math.round(p.nutriments["carbohydrates_100g"] ?? 0),
            fat: Math.round(p.nutriments["fat_100g"] ?? 0),
          },
          source: "off" as const,
        }))
    );
  } catch {
    return [];
  }
}

async function searchUSDA(query: string, apiKey: string): Promise<FoodResult[]> {
  try {
    const res = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&api_key=${apiKey}&pageSize=8&dataType=Foundation,SR%20Legacy`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return [];
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.foods ?? []).slice(0, 5).map((f: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const get = (id: number) => Math.round(f.foodNutrients?.find((n: any) => n.nutrientId === id)?.value ?? 0);
      return {
        id: `usda-${f.fdcId}`,
        name: f.description,
        per100g: {
          calories: get(1008),
          protein: get(1003),
          carbs: get(1005),
          fat: get(1004),
        },
        source: "usda" as const,
      };
    });
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();
  if (!query || query.length < 2) return NextResponse.json([]);

  const usdaKey = process.env.USDA_API_KEY;
  const [offResults, usdaResults] = await Promise.all([
    searchOpenFoodFacts(query),
    usdaKey ? searchUSDA(query, usdaKey) : Promise.resolve([]),
  ]);

  return NextResponse.json([...offResults, ...usdaResults]);
}
