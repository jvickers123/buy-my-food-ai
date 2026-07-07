import type { PlanState, BasketLine } from "./types";
import { MEALS } from "./data";

// Derive the final shopping list from everything the user decided.
// Meals contribute their ingredients; ticked essentials contribute themselves.
export function buildBasket(plan: PlanState): BasketLine[] {
  const lines: BasketLine[] = [];

  for (const id of plan.acceptedMealIds) {
    const meal = MEALS.find((m) => m.id === id);
    if (!meal) continue;
    for (const ing of meal.ingredients) {
      const { name, qty } = splitIngredient(ing);
      lines.push({
        id: `${id}-${name}`,
        name,
        qty,
        source: "meal",
        sourceLabel: meal.name,
      });
    }
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

// "Chorizo 200g" -> { name: "Chorizo", qty: "200g" }. Trailing token that
// contains a digit is treated as quantity; otherwise qty defaults to "1".
function splitIngredient(raw: string): { name: string; qty: string } {
  const parts = raw.trim().split(" ");
  const last = parts[parts.length - 1];
  if (parts.length > 1 && /\d/.test(last)) {
    return { name: parts.slice(0, -1).join(" "), qty: last };
  }
  return { name: raw, qty: "1" };
}

export function nightsEatingIn(plan: PlanState): number {
  return plan.nights.filter((n) => n.eatingIn).length;
}
