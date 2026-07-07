import type { Meal, Season, SuggestionContext } from "./types";
import { CONTEXT } from "./data";

// ---------------------------------------------------------------------------
// Context resolution
// ---------------------------------------------------------------------------
// In this prototype the weather + event context is mocked in data.ts. A real
// integration would fetch weather (e.g. Open-Meteo) and events (a holidays API)
// here. We still derive the *season* from the real date for a touch of realism,
// while keeping the mocked weather/event to guarantee a predictable demo.

export function seasonForDate(date = new Date()): Season {
  // Northern-hemisphere meteorological seasons by month.
  const m = date.getMonth(); // 0 = Jan
  if (m <= 1 || m === 11) return "winter";
  if (m <= 4) return "spring";
  if (m <= 7) return "summer";
  return "autumn";
}

export function resolveContext(): SuggestionContext {
  // Mocked weather + event, real-date-derived season overlaid.
  return { ...CONTEXT, season: seasonForDate() };
}

// ---------------------------------------------------------------------------
// Scoring & ranking
// ---------------------------------------------------------------------------
// Score a meal by how well its tags overlap the context's favoured tags. Event
// context is the strongest signal, so tags tied to the event weigh more.

const EVENT_TAGS = new Set(["bbq", "summery"]); // tags most tied to the event vibe

export function scoreMeal(meal: Meal, context: SuggestionContext): number {
  const favoured = new Set(context.themeTags);
  let score = 0;
  for (const tag of meal.tags) {
    if (!favoured.has(tag)) continue;
    score += EVENT_TAGS.has(tag) ? 2 : 1;
  }
  return score;
}

// Return a new array of meals sorted by descending context score. Stable: meals
// with equal scores keep their original order. Never mutates the input.
export function rankMeals(meals: Meal[], context: SuggestionContext): Meal[] {
  return meals
    .map((meal, index) => ({ meal, index, score: scoreMeal(meal, context) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.meal);
}
