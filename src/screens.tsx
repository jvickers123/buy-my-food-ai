import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import SwipeCard from "./SwipeCard";
import { MEALS, NIGHTS, SHOP_TRAITS, SHOP_PERSONA } from "./data";
import { buildBasket, nightsEatingIn } from "./basket";
import { rankMeals, resolveContext } from "./suggestions";
import type { PlanState, RegularItem, ChatMessage } from "./types";

// Shared props: each screen reads/updates the plan and calls next() to advance.
interface ScreenProps {
  plan: PlanState;
  setPlan: (updater: (p: PlanState) => PlanState) => void;
  next: () => void;
  skip?: () => void; // advance an extra step (e.g. Upload skipping the profile)
}

/* ============ 0. Welcome ============ */
export function Welcome({ next }: ScreenProps) {
  return (
    <div className="screen screen-pad fade-in">
      <div className="hero">
        <div className="logo">🥕</div>
        <h1>Munch</h1>
        <p>Your whole weekly shop, planned in a few swipes. Like Hello Fresh met Tinder.</p>
        <div className="steps-mini">
          <div className="mini"><span className="n">1</span> Tell us about your household</div>
          <div className="mini"><span className="n">2</span> Swipe the meals you fancy</div>
          <div className="mini"><span className="n">3</span> We build your basket</div>
        </div>
      </div>
      <div className="footer">
        <button className="btn" onClick={next}>Let’s go</button>
      </div>
    </div>
  );
}

/* ============ 1. Upload receipt ============ */
export function Upload({ plan, setPlan, next, skip }: ScreenProps) {
  const done = plan.receiptUploaded;
  return (
    <div className="screen screen-pad fade-in">
      <span className="eyebrow">Step 1 · Calibrate</span>
      <h1 className="title">Hello! Upload your latest supermarket order</h1>
      <p className="sub">Drop in a recent receipt or order confirmation. We’ll learn what you actually buy — brands, staples, portion sizes — and tune every suggestion to it.</p>

      <button
        className={`upload ${done ? "done" : ""}`}
        onClick={() => setPlan((p) => ({ ...p, receiptUploaded: true }))}
        style={{ width: "100%" }}
      >
        {done ? (
          <>
            <div className="plus">✓</div>
            <strong>tesco-order-jul.pdf</strong>
            <small>Nice — 34 items read. Suggestions calibrated.</small>
          </>
        ) : (
          <>
            <div className="plus">+</div>
            <strong>Add receipt or order</strong>
            <small>PDF, photo or screenshot</small>
          </>
        )}
      </button>

      <div className="footer">
        {!done && <button className="btn ghost" onClick={skip}>Skip for now</button>}
        <button className="btn" onClick={done ? next : skip} disabled={false}>
          {done ? "See my shopping profile" : "Continue without"}
        </button>
      </div>
    </div>
  );
}

/* ============ 1b. Shop profile — the delight moment ============ */
export function ShopProfile({ plan, next }: ScreenProps) {
  // Preview of the regulars we detected — the full add/drop manager is the
  // next step (Regulars). Here we just tease what we found.
  const preview = plan.regulars.slice(0, 6);
  const found = plan.regulars.length;

  return (
    <div className="screen screen-pad fade-in">
      <span className="eyebrow">Receipt read ✓</span>
      <h1 className="title">Here’s what your shop says about you</h1>

      <motion.div
        className="persona"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 16 }}
      >
        <div className="persona-emoji">{SHOP_PERSONA.emoji}</div>
        <div className="persona-label">{SHOP_PERSONA.label}</div>
        <p>{SHOP_PERSONA.line}</p>
      </motion.div>

      <div className="trait-grid">
        {SHOP_TRAITS.map((t, i) => (
          <motion.div
            key={t.title}
            className="trait"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.14, type: "spring", stiffness: 260, damping: 20 }}
          >
            <span className="trait-emoji">{t.emoji}</span>
            <strong>{t.title}</strong>
            <small>{t.detail}</small>
          </motion.div>
        ))}
      </div>

      <div className="group-label">We also spotted your regulars</div>
      <p className="sub" style={{ marginBottom: 12 }}>
        {found} things you buy again and again. You’ll fine-tune these next.
      </p>
      <div className="chips">
        {preview.map((r) => (
          <span key={r.id} className="chip on">{r.emoji} {r.name}</span>
        ))}
        {found > preview.length && <span className="chip">+{found - preview.length} more</span>}
      </div>

      <div className="footer">
        <button className="btn" onClick={next}>Love it — show my regulars</button>
      </div>
    </div>
  );
}

/* ============ 2. Household ============ */
const DIET_CHIPS = ["Vegetarian", "Vegan", "No nuts", "Gluten-free", "Dairy-free", "Pescatarian", "Halal"];

export function HouseholdScreen({ plan, setPlan, next }: ScreenProps) {
  const { adults, children, dietNotes } = plan.household;
  const activeChips = useMemo(
    () => new Set(dietNotes.split(",").map((s) => s.trim()).filter(Boolean)),
    [dietNotes]
  );

  const setCount = (key: "adults" | "children", delta: number) =>
    setPlan((p) => ({
      ...p,
      household: { ...p.household, [key]: Math.max(key === "adults" ? 1 : 0, p.household[key] + delta) },
    }));

  const toggleChip = (chip: string) => {
    const set = new Set(activeChips);
    set.has(chip) ? set.delete(chip) : set.add(chip);
    setPlan((p) => ({ ...p, household: { ...p.household, dietNotes: Array.from(set).join(", ") } }));
  };

  return (
    <div className="screen screen-pad fade-in">
      <span className="eyebrow">Step 2 · Your household</span>
      <h1 className="title">Who are we feeding?</h1>
      <p className="sub">This sets portion sizes and how many dinners we plan for.</p>

      <div className="field">
        <div className="stepper">
          <div className="who">Adults<small>Full portions</small></div>
          <div className="ctrls">
            <button className="round" onClick={() => setCount("adults", -1)} disabled={adults <= 1}>−</button>
            <span className="count">{adults}</span>
            <button className="round" onClick={() => setCount("adults", 1)}>+</button>
          </div>
        </div>
      </div>

      <div className="field">
        <div className="stepper">
          <div className="who">Children<small>Smaller portions</small></div>
          <div className="ctrls">
            <button className="round" onClick={() => setCount("children", -1)} disabled={children <= 0}>−</button>
            <span className="count">{children}</span>
            <button className="round" onClick={() => setCount("children", 1)}>+</button>
          </div>
        </div>
      </div>

      <div className="field">
        <label>Allergies &amp; diet</label>
        <div className="chips">
          {DIET_CHIPS.map((c) => (
            <button key={c} className={`chip ${activeChips.has(c) ? "on" : ""}`} onClick={() => toggleChip(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="footer">
        <button className="btn" onClick={next}>Find our meals</button>
      </div>
    </div>
  );
}

/* ============ 2b. Inspiration — weather / season / event context ============ */
export function Inspiration({ plan, setPlan, next }: ScreenProps) {
  // Seed the context on first view (lazy-seed pattern, like Calendar's nights).
  const context = plan.context ?? resolveContext();
  if (!plan.context) {
    setPlan((p) => (p.context ? p : { ...p, context }));
  }

  const { weather, season, event } = context;
  const seasonLabel = season.charAt(0).toUpperCase() + season.slice(1);

  // Preview the top few meals this context surfaces first.
  const topPicks = useMemo(() => rankMeals(MEALS, context).slice(0, 3), [context]);

  return (
    <div className="screen screen-pad fade-in">
      <span className="eyebrow">Before you swipe</span>
      <h1 className="title">We checked what’s happening this week</h1>
      <p className="sub">Weather, season and what’s on — so the meals we show you actually fit the moment.</p>

      <motion.div
        className="persona"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 16 }}
      >
        <div className="persona-emoji">{weather.emoji}</div>
        <div className="persona-label">{weather.descriptor} · {weather.tempC}°C</div>
        <p>{seasonLabel} · {event ? event.name : "no big events this week"}</p>
      </motion.div>

      {event && (
        <div className="callout">
          <span className="ico">{event.emoji}</span>
          <span className="txt">{event.blurb}</span>
        </div>
      )}

      <div className="group-label">So we’ve bumped these to the top</div>
      <div className="list">
        {topPicks.map((m) => (
          <div key={m.id} className="row">
            <span className="body"><strong>{m.name}</strong><small>{m.tags.slice(0, 3).join(" · ")}</small></span>
          </div>
        ))}
      </div>

      <div className="footer">
        <button className="btn" onClick={next}>Sounds good — let’s swipe</button>
      </div>
    </div>
  );
}

/* ============ 3. Swipe deck ============ */
export function Swipe({ plan, setPlan, next }: ScreenProps) {
  const [cursor, setCursor] = useState(0);

  // Order the deck by how well each meal fits this week's context, so the most
  // fitting meals surface first. Falls back to a fresh resolve if unseeded.
  const deck = useMemo(
    () => rankMeals(MEALS, plan.context ?? resolveContext()),
    [plan.context]
  );

  const decide = (accepted: boolean) => {
    const meal = deck[cursor];
    if (!meal) return;
    if (accepted) {
      setPlan((p) =>
        p.acceptedMealIds.includes(meal.id)
          ? p
          : { ...p, acceptedMealIds: [...p.acceptedMealIds, meal.id] }
      );
    }
    setCursor((c) => c + 1);
  };

  // Trigger a fling on the top card from the round buttons.
  const [flingSignal, setFlingSignal] = useState<{ dir: 1 | -1; at: number } | null>(null);
  const remaining = deck.length - cursor;
  const accepted = plan.acceptedMealIds.length;
  const ctx = plan.context ?? resolveContext();

  return (
    <div className="screen fade-in" style={{ paddingBottom: 12 }}>
      <span className="eyebrow">Step 4 · This week’s meals</span>
      <h1 className="title" style={{ fontSize: 23, marginBottom: 2 }}>Swipe what you fancy</h1>
      <p className="sub" style={{ marginBottom: 8 }}>
        <b style={{ color: "var(--green)" }}>Right = yes please</b>, left = not this week.
      </p>

      <div className="chips" style={{ marginBottom: 8 }}>
        <span className="chip on">{ctx.weather.emoji} {ctx.weather.descriptor} picks first</span>
      </div>

      <div className="deck-wrap">
        <div className="deck">
          {remaining === 0 && (
            <div className="deck-empty">
              <div>
                <div style={{ fontSize: 40 }}>🧺</div>
                <p style={{ marginTop: 8 }}><b>{accepted} meals</b> in your basket.<br />Ready for your regulars?</p>
              </div>
            </div>
          )}
          {deck.map((meal, i) => {
            const depth = i - cursor;
            if (depth < 0 || depth > 2) return null;
            return (
              <SwipeCard
                key={meal.id}
                meal={meal}
                index={depth}
                isTop={depth === 0}
                onDecision={decide}
                flingSignal={depth === 0 ? flingSignal : null}
              />
            );
          })}
        </div>

        {remaining > 0 ? (
          <>
            <div className="swipe-btns">
              <button className="nope" onClick={() => setFlingSignal({ dir: -1, at: Date.now() })} aria-label="Not this week">✕</button>
              <button className="yum" onClick={() => setFlingSignal({ dir: 1, at: Date.now() })} aria-label="Yes please">♥</button>
            </div>
            <div className="deck-counter">{remaining} to go · {accepted} added</div>
          </>
        ) : (
          <div className="footer" style={{ position: "static", padding: "8px 0" }}>
            <button className="btn" onClick={next} disabled={accepted === 0}>
              {accepted === 0 ? "Pick at least one meal" : `Continue with ${accepted} meals`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ 4. Regulars ============ */
// The single "things you buy regularly" manager — groceries and household
// essentials merged into one deduped list, grouped by category.
export function Regulars({ plan, setPlan, next }: ScreenProps) {
  const toggle = (id: string) =>
    setPlan((p) => ({
      ...p,
      regulars: p.regulars.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)),
    }));

  const groups = plan.regulars.reduce<Record<string, RegularItem[]>>((acc, r) => {
    (acc[r.category] ||= []).push(r);
    return acc;
  }, {});
  const chosen = plan.regulars.filter((r) => r.selected).length;

  return (
    <div className="screen screen-pad fade-in">
      <span className="eyebrow">Step 5 · Your regulars</span>
      <h1 className="title">The things you always buy</h1>
      <p className="sub">Groceries and household essentials we spotted across your past orders. Tap to add or drop any.</p>

      {Object.entries(groups).map(([cat, items]) => (
        <div key={cat}>
          <div className="group-label">{cat}</div>
          <div className="list">
            {items.map((r) => (
              <button key={r.id} className="row" onClick={() => toggle(r.id)} style={{ textAlign: "left" }}>
                <span className={`check ${r.selected ? "on" : ""}`}>{r.selected ? "✓" : ""}</span>
                <span className="body"><strong>{r.emoji} {r.name}</strong><small>{r.cadence}</small></span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="footer">
        <button className="btn" onClick={next}>Add {chosen} regulars</button>
      </div>
    </div>
  );
}

/* ============ 5. Calendar ============ */
export function Calendar({ plan, setPlan, next }: ScreenProps) {
  // Seed nights from mock calendar on first view if empty.
  if (plan.nights.length === 0) {
    setPlan((p) => ({ ...p, nights: NIGHTS.map((n) => ({ ...n })) }));
  }
  const nights = plan.nights.length ? plan.nights : NIGHTS;
  const toggle = (day: string) =>
    setPlan((p) => ({
      ...p,
      nights: p.nights.map((n) => (n.day === day ? { ...n, eatingIn: !n.eatingIn } : n)),
    }));

  const inCount = nights.filter((n) => n.eatingIn).length;
  const out = nights.filter((n) => !n.eatingIn);

  return (
    <div className="screen screen-pad fade-in">
      <span className="eyebrow">Step 6 · Your week</span>
      <h1 className="title">We checked your calendar</h1>
      <div className="callout">
        <span className="ico">📅</span>
        <span className="txt">
          Connected to <b>Google Calendar</b>.{" "}
          {out.length > 0 ? (
            <>You’re out <b>{out.map((n) => n.day).join(" & ")}</b> — so we’ll plan <b>{inCount} dinners</b>, not 7.</>
          ) : (
            <>Looks like you’re in every night — planning <b>7 dinners</b>.</>
          )}
        </span>
      </div>

      <div className="list">
        {nights.map((n) => (
          <div key={n.day} className="row">
            <span className="body">
              <strong>{n.day}</strong>
              <small>{n.eatingIn ? "Eating in" : n.note || "Out"}</small>
            </span>
            <button className={`toggle ${n.eatingIn ? "on" : ""}`} onClick={() => toggle(n.day)} aria-label={`${n.day} eating in`} />
          </div>
        ))}
      </div>

      <div className="footer">
        <button className="btn" onClick={next}>Looks right — {inCount} nights in</button>
      </div>
    </div>
  );
}

/* ============ 6. Chat ============ */
const SUGGESTIONS = ["Make it a bit cheaper", "Add a dessert", "Swap the fish meal", "More veg please"];

export function Chat({ plan, setPlan, next }: ScreenProps) {
  const [draft, setDraft] = useState("");
  const chat = plan.chat.length
    ? plan.chat
    : [{ id: "seed", role: "assistant", text: `Your basket’s nearly ready — ${plan.acceptedMealIds.length} meals plus your regulars. Want me to tweak anything before I finalise it?` } as ChatMessage];

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const userMsg: ChatMessage = { id: `u${Date.now()}`, role: "user", text: t };
    const reply: ChatMessage = { id: `a${Date.now()}`, role: "assistant", text: mockReply(t) };
    setPlan((p) => ({ ...p, chat: [...(p.chat.length ? p.chat : chat), userMsg, reply] }));
    setDraft("");
  };

  return (
    <div className="screen fade-in" style={{ paddingBottom: 12 }}>
      <span className="eyebrow">Step 7 · Final tweaks</span>
      <h1 className="title" style={{ fontSize: 23 }}>Anything else?</h1>

      <div className="chat-scroll">
        {chat.map((m) => (
          <div key={m.id} className={`bubble ${m.role}`}>{m.text}</div>
        ))}
      </div>

      <div className="suggest-row">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="suggest" onClick={() => send(s)}>{s}</button>
        ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Tell me anything about your household…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(draft)}
        />
        <button className="send" onClick={() => send(draft)}>↑</button>
      </div>

      <div style={{ paddingTop: 12 }}>
        <button className="btn" onClick={next}>Build my shopping list</button>
      </div>
    </div>
  );
}

function mockReply(input: string): string {
  const t = input.toLowerCase();
  if (t.includes("cheap")) return "Done — I’ve swapped the salmon for the butter bean stew and dropped two branded items for own-brand. Roughly £11 lighter.";
  if (t.includes("dessert")) return "Added — a simple chocolate mousse (dark chocolate, eggs, cream). Ingredients are in your basket.";
  if (t.includes("fish")) return "Swapped the fish tacos for the black bean quesadillas. Kept it veggie and quick.";
  if (t.includes("veg")) return "Bumped up the veg — extra spinach, tenderstem and a bag of salad added across the week.";
  return "Got it — I’ve noted that and adjusted the basket accordingly.";
}

/* ============ 7. Final order ============ */
// Cap how many items we actually push to Tesco so demos stay quick. Set to
// Infinity to send the whole basket.
const DEMO_MAX_ITEMS = 3;

type CheckoutStatus = "idle" | "running" | "done" | "error";

interface AddedLine {
  requested: string;
  matched: string | null;
  added: boolean;
}

export function Order({ plan }: ScreenProps) {
  const basket = useMemo(() => buildBasket(plan), [plan]);
  const [status, setStatus] = useState<CheckoutStatus>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [basketUrl, setBasketUrl] = useState<string | null>(null);
  const [added, setAdded] = useState<AddedLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const mealCount = plan.acceptedMealIds.length;
  const nights = nightsEatingIn(plan);
  const est = (basket.length * 2.4 + 6).toFixed(2); // playful mock total

  const byMeal = basket.reduce<Record<string, typeof basket>>((acc, l) => {
    (acc[l.sourceLabel] ||= []).push(l);
    return acc;
  }, {});

  const sendToTesco = async () => {
    setStatus("running");
    setLogs([]);
    setError(null);
    setAdded([]);
    setBasketUrl(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: basket
            .slice(0, DEMO_MAX_ITEMS)
            .map((l) => ({ name: l.name, qty: l.qty })),
        }),
      });
      if (!res.ok || !res.body) throw new Error(`Server responded ${res.status}`);

      // Parse the Server-Sent Events stream chunk by chunk.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const eventLine = frame.split("\n").find((l) => l.startsWith("event:"));
          const dataLine = frame.split("\n").find((l) => l.startsWith("data:"));
          if (!dataLine) continue;
          const event = eventLine ? eventLine.slice(6).trim() : "message";
          const data = JSON.parse(dataLine.slice(5).trim());
          if (event === "progress") {
            setLogs((prev) => [...prev, data.message]);
          } else if (event === "done") {
            setBasketUrl(data.basketUrl);
            setAdded(data.added ?? []);
            setStatus("done");
          } else if (event === "error") {
            setError(data.error);
            setStatus("error");
          }
        }
      }
      // Stream ended without a terminal event.
      setStatus((s) => (s === "running" ? "error" : s));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  };

  return (
    <div className="screen screen-pad fade-in">
      <span className="eyebrow">Done · Your order</span>
      <div className="order-head">
        <span className="tesco-tag">🛒 Ready to send to Tesco</span>
        <div className="big" style={{ marginTop: 10 }}>£{est}</div>
        <div className="row2">
          <span>{mealCount} meals · {nights} nights in</span>
          <span>{basket.length} items</span>
        </div>
      </div>

      {(status === "running" || logs.length > 0) && (
        <div className="checkout-log">
          {logs.map((line, i) => (
            <div key={i} className="checkout-log-line">
              {status === "running" && i === logs.length - 1 ? "▸ " : "· "}
              {line}
            </div>
          ))}
          {status === "running" && logs.length === 0 && (
            <div className="checkout-log-line">▸ Starting up the browser…</div>
          )}
        </div>
      )}

      {status === "error" && error && (
        <div className="checkout-error">Couldn’t finish: {error}</div>
      )}

      {status === "done" && added.length > 0 && (
        <div className="list" style={{ marginTop: 12 }}>
          {added.map((a, i) => (
            <div key={i} className="row">
              <span className="body">
                <strong>{a.requested}</strong>
                <small>{a.matched ? `→ ${a.matched}` : "no match found"}</small>
              </span>
              <span className="qty">{a.added ? "✓" : "—"}</span>
            </div>
          ))}
        </div>
      )}

      {Object.entries(byMeal).map(([label, lines]) => (
        <div key={label}>
          <div className="group-label">{label}</div>
          <div className="list">
            {lines.map((l) => (
              <div key={l.id} className="row">
                <span className="body"><strong>{l.name}</strong></span>
                <span className="qty">{l.qty}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="footer">
        {status === "done" && basketUrl ? (
          <a className="btn" href={basketUrl} target="_blank" rel="noreferrer">
            Open your Tesco basket →
          </a>
        ) : (
          <button className="btn" onClick={sendToTesco} disabled={status === "running"}>
            {status === "running"
              ? "Adding to Tesco…"
              : status === "error"
              ? "Try again →"
              : `Send ${Math.min(basket.length, DEMO_MAX_ITEMS)} items to Tesco →`}
          </button>
        )}
      </div>
    </div>
  );
}
