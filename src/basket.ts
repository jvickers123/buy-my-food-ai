import type { PlanState, BasketLine } from "./types";
import { buildIngredientList, formatQty } from "./ingredients";

// Derive the final shopping list from everything the user decided.
// Meals contribute their (scaled + aggregated) ingredients; ticked essentials
// contribute themselves.
export function buildBasket(plan: PlanState): BasketLine[] {
  const lines: BasketLine[] = [];

  // Aggregated, deduped ingredients across all accepted meals.
  for (const item of buildIngredientList(plan)) {
    lines.push({
      id: `meal-${item.name}`,
      name: item.name,
      qty: formatQty(item),
      source: "meal",
      sourceLabel: "Meal ingredients",
    });
  }

  for (const e of plan.essentials) {
    if (!e.selected) continue;
    lines.push({
      id: e.id,
      name: e.name,
      qty: "1",
      source: "essential",
      sourceLabel: e.category,
    });
  }

  return lines;
}

export function nightsEatingIn(plan: PlanState): number {
  return plan.nights.filter((n) => n.eatingIn).length;
}
