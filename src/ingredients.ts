import type {
  Ingredient,
  AggregatedIngredient,
  Meal,
  PlanState,
  Unit,
} from "./types";
import { MEALS } from "./data";
import { nightsEatingIn } from "./basket";

// ---------------------------------------------------------------------------
// Unit normalisation
// ---------------------------------------------------------------------------
// Weight/volume units convert to a base unit so we can add them together.
// Count-based units ("buy N whole things") never sub-divide and must round up.

type UnitFamily = "weight" | "volume" | "count";

const UNIT_META: Record<Unit, { family: UnitFamily; base?: Unit; toBase?: number }> = {
  g: { family: "weight", base: "g", toBase: 1 },
  kg: { family: "weight", base: "g", toBase: 1000 },
  ml: { family: "volume", base: "ml", toBase: 1 },
  l: { family: "volume", base: "ml", toBase: 1000 },
  tin: { family: "count" },
  pack: { family: "count" },
  block: { family: "count" },
  loaf: { family: "count" },
  jar: { family: "count" },
  tub: { family: "count" },
  unit: { family: "count" },
};

function isCount(unit: Unit): boolean {
  return UNIT_META[unit].family === "count";
}

// Convert a qty into its family's base unit (g / ml). Count units are returned
// unchanged — they only aggregate with an identical unit.
function toBase(qty: number, unit: Unit): { qty: number; unit: Unit } {
  const meta = UNIT_META[unit];
  if (meta.family === "count") return { qty, unit };
  return { qty: qty * (meta.toBase ?? 1), unit: meta.base ?? unit };
}

// Pick the friendliest display unit for a base amount, e.g. 1500g -> 1.5kg.
function prettify(qty: number, baseUnit: Unit): { qty: number; unit: Unit } {
  if (baseUnit === "g" && qty >= 1000) return { qty: round(qty / 1000, 2), unit: "kg" };
  if (baseUnit === "ml" && qty >= 1000) return { qty: round(qty / 1000, 2), unit: "l" };
  return { qty: round(qty, 0), unit: baseUnit };
}

function round(n: number, dp: number): number {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}

// ---------------------------------------------------------------------------
// Serving scaling
// ---------------------------------------------------------------------------
// Scale factor combines household size against the meal's default servings, and
// the share of nights the household actually eats in. A meal cooked for a bigger
// household needs more of its scalable ingredients; if hardly any nights are
// spent eating in we trim portions rather than over-buying.

export function scaleFactor(plan: PlanState, meal: Meal): number {
  const people = Math.max(1, plan.household.adults + plan.household.children);
  const householdFactor = people / meal.servings;

  // Nights-in weighting: 7 nights in = full portions, fewer nights scales down,
  // floored so we never zero-out an accepted meal.
  const nights = nightsEatingIn(plan);
  const nightsFactor = Math.max(0.5, nights / 7);

  return householdFactor * nightsFactor;
}

// Apply the scale factor to a single meal's ingredients. Non-scalable items
// (spices, jars) pass through untouched.
function scaleIngredients(ingredients: Ingredient[], factor: number): Ingredient[] {
  return ingredients.map((ing) =>
    ing.scalable ? { ...ing, qty: ing.qty * factor } : { ...ing },
  );
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------
// Group by canonical name + unit family, sum in base units, then round: count
// units round up (can't buy 1.3 tins); weight/volume round to a tidy display
// unit.

export function aggregate(ingredients: Ingredient[]): AggregatedIngredient[] {
  const buckets = new Map<string, { name: string; baseQty: number; baseUnit: Unit; count: boolean }>();

  for (const ing of ingredients) {
    const { qty, unit } = toBase(ing.qty, ing.unit);
    const key = `${ing.name.toLowerCase()}|${unit}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.baseQty += qty;
    } else {
      buckets.set(key, {
        name: ing.name,
        baseQty: qty,
        baseUnit: unit,
        count: isCount(unit),
      });
    }
  }

  const out: AggregatedIngredient[] = [];
  for (const b of buckets.values()) {
    if (b.count) {
      out.push({ name: b.name, qty: Math.ceil(b.baseQty), unit: b.baseUnit });
    } else {
      const { qty, unit } = prettify(b.baseQty, b.baseUnit);
      out.push({ name: b.name, qty, unit });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Pipeline entry point
// ---------------------------------------------------------------------------
// Gather scaled ingredients from every accepted meal and aggregate into the
// clean, deduped list.

export function buildIngredientList(plan: PlanState): AggregatedIngredient[] {
  const all: Ingredient[] = [];
  for (const id of plan.acceptedMealIds) {
    const meal = MEALS.find((m) => m.id === id);
    if (!meal) continue;
    all.push(...scaleIngredients(meal.ingredients, scaleFactor(plan, meal)));
  }
  return aggregate(all);
}

// ---------------------------------------------------------------------------
// API handoff
// ---------------------------------------------------------------------------
// The shape a downstream shopping API would consume. The API integration itself
// is out of scope — this is where the two systems meet.

export function toApiPayload(plan: PlanState): AggregatedIngredient[] {
  return buildIngredientList(plan);
}

// Friendly display string for a single aggregated line.
// Count units: "×8" for `unit`, "3 tins" otherwise. Weight/volume: "1.5kg".
export function formatQty(item: AggregatedIngredient): string {
  if (item.unit === "unit") return `×${item.qty}`;
  if (isCount(item.unit)) {
    const label = item.qty === 1 ? item.unit : pluralise(item.unit);
    return `${item.qty} ${label}`;
  }
  return `${item.qty}${item.unit}`;
}

function pluralise(unit: Unit): string {
  if (unit === "loaf") return "loaves";
  return `${unit}s`;
}
