import { useMemo, useState } from "react";
import SwipeCard from "./SwipeCard";
import { MEALS, NIGHTS } from "./data";
import { buildBasket, nightsEatingIn } from "./basket";
import type { PlanState, EssentialItem, ChatMessage } from "./types";

// Shared props: each screen reads/updates the plan and calls next() to advance.
interface ScreenProps {
  plan: PlanState;
  setPlan: (updater: (p: PlanState) => PlanState) => void;
  next: () => void;
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
export function Upload({ plan, setPlan, next }: ScreenProps) {
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
        {!done && <button className="btn ghost" onClick={next}>Skip for now</button>}
        <button className="btn" onClick={next} disabled={false}>
          {done ? "Continue" : "Continue without"}
        </button>
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

/* ============ 3. Swipe deck ============ */
export function Swipe({ plan, setPlan, next }: ScreenProps) {
  const [cursor, setCursor] = useState(0);

  const decide = (accepted: boolean) => {
    const meal = MEALS[cursor];
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
  const remaining = MEALS.length - cursor;
  const accepted = plan.acceptedMealIds.length;

  return (
    <div className="screen fade-in" style={{ paddingBottom: 12 }}>
      <span className="eyebrow">Step 3 · This week’s meals</span>
      <h1 className="title" style={{ fontSize: 23, marginBottom: 2 }}>Swipe what you fancy</h1>
      <p className="sub" style={{ marginBottom: 8 }}>
        <b style={{ color: "var(--green)" }}>Right = yes please</b>, left = not this week.
      </p>

      <div className="deck-wrap">
        <div className="deck">
          {remaining === 0 && (
            <div className="deck-empty">
              <div>
                <div style={{ fontSize: 40 }}>🧺</div>
                <p style={{ marginTop: 8 }}><b>{accepted} meals</b> in your basket.<br />Ready for the essentials?</p>
              </div>
            </div>
          )}
          {MEALS.map((meal, i) => {
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

/* ============ 4. Essentials ============ */
export function Essentials({ plan, setPlan, next }: ScreenProps) {
  const toggle = (id: string) =>
    setPlan((p) => ({
      ...p,
      essentials: p.essentials.map((e) => (e.id === id ? { ...e, selected: !e.selected } : e)),
    }));

  const groups = plan.essentials.reduce<Record<string, EssentialItem[]>>((acc, e) => {
    (acc[e.category] ||= []).push(e);
    return acc;
  }, {});
  const chosen = plan.essentials.filter((e) => e.selected).length;

  return (
    <div className="screen screen-pad fade-in">
      <span className="eyebrow">Step 4 · Essentials</span>
      <h1 className="title">Don’t forget the staples</h1>
      <p className="sub">Based on your previous orders — here’s what you usually restock. Tap to add or drop.</p>

      {Object.entries(groups).map(([cat, items]) => (
        <div key={cat}>
          <div className="group-label">{cat}</div>
          <div className="list">
            {items.map((e) => (
              <button key={e.id} className="row" onClick={() => toggle(e.id)} style={{ textAlign: "left" }}>
                <span className={`check ${e.selected ? "on" : ""}`}>{e.selected ? "✓" : ""}</span>
                <span className="body"><strong>{e.name}</strong><small>{e.reason}</small></span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="footer">
        <button className="btn" onClick={next}>Add {chosen} essentials</button>
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
      <span className="eyebrow">Step 5 · Your week</span>
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
    : [{ id: "seed", role: "assistant", text: `Your basket’s nearly ready — ${plan.acceptedMealIds.length} meals plus your essentials. Want me to tweak anything before I finalise it?` } as ChatMessage];

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
      <span className="eyebrow">Step 6 · Final tweaks</span>
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
