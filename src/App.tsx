import { useState } from "react";
import { ESSENTIALS } from "./data";
import type { PlanState } from "./types";
import {
  Welcome,
  Upload,
  HouseholdScreen,
  Swipe,
  Essentials,
  Calendar,
  Chat,
  Order,
} from "./screens";

const initialPlan: PlanState = {
  household: { adults: 2, children: 0, dietNotes: "" },
  receiptUploaded: false,
  acceptedMealIds: [],
  essentials: ESSENTIALS.map((e) => ({ ...e })),
  nights: [],
  chat: [],
};

// Ordered flow. Welcome is step 0 and sits outside the progress bar count.
const STEPS = [Welcome, Upload, HouseholdScreen, Swipe, Essentials, Calendar, Chat, Order];

export default function App() {
  const [step, setStep] = useState(0);
  const [plan, setPlanState] = useState<PlanState>(initialPlan);

  const setPlan = (updater: (p: PlanState) => PlanState) => setPlanState((p) => updater(p));
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const Current = STEPS[step];
  const showProgress = step > 0;
  const progressTotal = STEPS.length - 1; // exclude welcome

  return (
    <div className="phone">
      {showProgress && (
        <div className="progress">
          {Array.from({ length: progressTotal }).map((_, i) => (
            <span key={i} className={i < step ? "on" : ""} />
          ))}
        </div>
      )}
      {step > 0 && step < STEPS.length && (
        <button
          className="btn ghost"
          onClick={back}
          style={{ position: "absolute", top: 8, left: 6, width: "auto", padding: "8px 12px", fontSize: 15, zIndex: 20 }}
        >
          ‹ Back
        </button>
      )}
      <Current plan={plan} setPlan={setPlan} next={next} />
    </div>
  );
}
