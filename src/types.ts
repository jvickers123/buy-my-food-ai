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

export interface EssentialItem {
  id: string;
  name: string;
  category: string; // "Cupboard staples", "Household", ...
  reason: string; // why we suggested it, e.g. "bought every shop"
  selected: boolean;
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
  source: "meal" | "essential";
  sourceLabel: string; // which meal / category it came from
}

// The single object we thread through the whole journey.
export interface PlanState {
  household: Household;
  receiptUploaded: boolean;
  acceptedMealIds: string[];
  essentials: EssentialItem[];
  nights: CalendarNight[];
  chat: ChatMessage[];
}
