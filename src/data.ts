import type { Meal, EssentialItem, CalendarNight } from "./types";

// Mock meal deck. Photos are Unsplash source URLs (food photography) so the
// cards read like Hello Fresh without shipping binary assets.
const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

export const MEALS: Meal[] = [
  {
    id: "m1",
    name: "Smoky Chorizo & Butter Bean Stew",
    blurb: "One-pot, smoked paprika, crusty bread on the side.",
    image: img("1455619452474-d2be8b1e70cd"),
    minutes: 30,
    servings: 4,
    tags: ["one-pot", "hearty"],
    nutrition: { kcal: 620, protein: 28, carbs: 54, fat: 30 },
    ingredients: ["Chorizo 200g", "Butter beans 2 tins", "Chopped tomatoes 2 tins", "Crusty bread 1 loaf", "Spinach 1 bag"],
  },
  {
    id: "m2",
    name: "Halloumi & Roasted Veg Traybake",
    blurb: "Veggie, sheet-pan, honey-drizzled peppers and courgette.",
    image: img("1540189549336-e6e99c3679fe"),
    minutes: 35,
    servings: 4,
    tags: ["veggie", "traybake"],
    nutrition: { kcal: 540, protein: 24, carbs: 38, fat: 32 },
    ingredients: ["Halloumi 2 blocks", "Peppers 3", "Courgette 2", "Red onion 2", "Couscous 300g"],
  },
  {
    id: "m3",
    name: "Thai Green Chicken Curry",
    blurb: "Fragrant, creamy, ready in half an hour with jasmine rice.",
    image: img("1455619452474-d2be8b1e70cd"),
    minutes: 30,
    servings: 4,
    tags: ["quick", "spicy"],
    nutrition: { kcal: 680, protein: 42, carbs: 62, fat: 26 },
    ingredients: ["Chicken thighs 600g", "Green curry paste 1 jar", "Coconut milk 2 tins", "Jasmine rice 500g", "Green beans 200g"],
  },
  {
    id: "m4",
    name: "Spaghetti Cacio e Pepe",
    blurb: "Three ingredients, ten minutes, weeknight hero.",
    image: img("1551892374-ecf8754cf8b0"),
    minutes: 15,
    servings: 4,
    tags: ["veggie", "quick"],
    nutrition: { kcal: 590, protein: 21, carbs: 78, fat: 22 },
    ingredients: ["Spaghetti 500g", "Pecorino 200g", "Black pepper 1 jar"],
  },
  {
    id: "m5",
    name: "Crispy Fish Tacos",
    blurb: "Lime slaw, chipotle mayo, soft tortillas. Friday sorted.",
    image: img("1565299624946-b28f40a0ae38"),
    minutes: 25,
    servings: 4,
    tags: ["fish", "fresh"],
    nutrition: { kcal: 560, protein: 34, carbs: 48, fat: 24 },
    ingredients: ["White fish fillets 4", "Tortillas 8", "Red cabbage 1", "Lime 3", "Chipotle mayo 1 jar"],
  },
  {
    id: "m6",
    name: "Lamb & Aubergine Moussaka",
    blurb: "Slow-baked, cinnamon-spiced, a proper Sunday centrepiece.",
    image: img("1544025162-d76694265947"),
    minutes: 70,
    servings: 6,
    tags: ["hearty", "batch"],
    nutrition: { kcal: 720, protein: 38, carbs: 44, fat: 42 },
    ingredients: ["Lamb mince 750g", "Aubergine 3", "Potatoes 1kg", "Bechamel 1 tub", "Cinnamon 1 jar"],
  },
  {
    id: "m7",
    name: "Miso Salmon & Greens",
    blurb: "Glazed salmon, quick-pickled cucumber, sticky rice.",
    image: img("1467003909585-2f8a72700288"),
    minutes: 25,
    servings: 4,
    tags: ["fish", "quick"],
    nutrition: { kcal: 610, protein: 40, carbs: 52, fat: 24 },
    ingredients: ["Salmon fillets 4", "Miso paste 1 tub", "Sushi rice 500g", "Tenderstem broccoli 2 packs", "Cucumber 1"],
  },
  {
    id: "m8",
    name: "Black Bean Quesadillas",
    blurb: "Veggie, kid-friendly, molten cheese, ready fast.",
    image: img("1618040996337-56904b7850b9"),
    minutes: 20,
    servings: 4,
    tags: ["veggie", "quick", "kids"],
    nutrition: { kcal: 520, protein: 22, carbs: 58, fat: 20 },
    ingredients: ["Tortillas 8", "Black beans 2 tins", "Cheddar 300g", "Sweetcorn 1 tin", "Salsa 1 jar"],
  },
];

// Essentials suggested from "past shopping" — pre-ticked where confidence is high.
export const ESSENTIALS: EssentialItem[] = [
  { id: "e1", name: "Toothpaste", category: "Household", reason: "Bought roughly monthly", selected: true },
  { id: "e2", name: "Toilet paper (9 pack)", category: "Household", reason: "In every shop", selected: true },
  { id: "e3", name: "Washing-up liquid", category: "Household", reason: "Bought every 3 weeks", selected: true },
  { id: "e4", name: "Semi-skimmed milk (4pt)", category: "Cupboard staples", reason: "Weekly staple", selected: true },
  { id: "e5", name: "Free-range eggs (12)", category: "Cupboard staples", reason: "Weekly staple", selected: true },
  { id: "e6", name: "Butter", category: "Cupboard staples", reason: "Bought fortnightly", selected: false },
  { id: "e7", name: "Bin bags", category: "Household", reason: "Bought monthly", selected: false },
  { id: "e8", name: "Coffee beans", category: "Cupboard staples", reason: "Bought fortnightly", selected: false },
];

// Mock Google Calendar read — one week, some nights out.
export const NIGHTS: CalendarNight[] = [
  { day: "Mon", eatingIn: true },
  { day: "Tue", eatingIn: true },
  { day: "Wed", eatingIn: false, note: "Five-a-side then pub" },
  { day: "Thu", eatingIn: false, note: "Dinner with Sam" },
  { day: "Fri", eatingIn: true },
  { day: "Sat", eatingIn: true },
  { day: "Sun", eatingIn: true },
];
