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

export interface Meal {
  id: string;
  name: string;
  blurb: string;
  image: string;
  minutes: number; // cook time
  servings: number;
  tags: string[]; // e.g. ["veggie", "quick"]
  nutrition: Nutrition;
  ingredients: string[]; // maps into the final basket
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

// The single object we thread through the whole journey.
export interface PlanState {
  household: Household;
  receiptUploaded: boolean;
  acceptedMealIds: string[];
  nights: CalendarNight[];
  chat: ChatMessage[];
  regulars: RegularItem[];
}
