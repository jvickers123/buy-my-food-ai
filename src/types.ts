// Domain types for the whole flow. Everything downstream reads these.

export interface Household {
  adults: number;
  children: number;
  dietNotes: string; // free text: allergies / diet, e.g. "no nuts, veggie on weekdays"
}

export interface Nutrition {
  kcal: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
}

// Units we understand. Weight/volume pairs normalise to a base; the rest are
// count-based ("buy N whole things") and never sub-divide.
export type Unit =
  | "g"
  | "kg"
  | "ml"
  | "l"
  | "tin"
  | "pack"
  | "block"
  | "loaf"
  | "jar"
  | "tub"
  | "unit";

// A single structured ingredient line on a meal.
export interface Ingredient {
  name: string; // canonical name — must match across meals to aggregate, e.g. "Tortillas"
  qty: number; // numeric quantity, in `unit`
  unit: Unit;
  scalable: boolean; // scale with servings? spices/jars usually false
}

// The clean, deduped, API-ready ingredient shape produced after aggregation.
export interface AggregatedIngredient {
  name: string;
  qty: number;
  unit: Unit;
}

export interface Meal {
  id: string;
  name: string;
  blurb: string;
  image: string;
  minutes: number; // cook time
  servings: number;
  tags: string[]; // e.g. ["veggie", "quick"]
  nutrition: Nutrition;
  ingredients: Ingredient[]; // structured; maps into the final basket
}

export interface CalendarNight {
  day: string; // "Mon" ... "Sun"
  eatingIn: boolean;
  note?: string; // e.g. "Out — dinner with Sam"
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export interface BasketLine {
  id: string;
  name: string;
  qty: string; // "2", "500g", "1 pack"
  source: "meal" | "regular";
  sourceLabel: string; // which meal / category it came from
}

export interface ShopTrait {
  emoji: string;
  title: string; // e.g. "Healthy Eater"
  detail: string; // the positive evidence, e.g. "Loads of fresh veg in every shop"
}

export interface RegularItem {
  id: string;
  name: string;
  category: string; // "Fresh & dairy", "Cupboard staples", "Household", ...
  cadence: string; // "Every shop", "Fortnightly"
  emoji: string;
  selected: boolean; // pre-add their regulars to the plan
}

export type Season = "spring" | "summer" | "autumn" | "winter";

// A snapshot of the weather we (pretend to) fetch to inspire meals.
export interface WeatherContext {
  condition: string; // "sunny", "rainy", ...
  tempC: number;
  emoji: string;
  descriptor: string; // human phrase, e.g. "hot & bright"
}

// A festival / major event happening around now, if any.
export interface EventContext {
  name: string; // "August Bank Holiday"
  emoji: string;
  blurb: string;
}

// The resolved context that inspires (re-ranks) meal suggestions. `themeTags`
// is the derived set of meal tags this context favours.
export interface SuggestionContext {
  weather: WeatherContext;
  season: Season;
  event: EventContext | null;
  themeTags: string[];
}

// The single object we thread through the whole journey.
export interface PlanState {
  household: Household;
  receiptUploaded: boolean;
  acceptedMealIds: string[];
  nights: CalendarNight[];
  chat: ChatMessage[];
  regulars: RegularItem[];
  context: SuggestionContext | null; // seeded on the Inspiration screen
}
