import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import type { Meal } from "./types";

interface Props {
  meal: Meal;
  onDecision: (accepted: boolean) => void;
  isTop: boolean;
  index: number; // stacking depth (0 = top)
  flingSignal: { dir: 1 | -1; at: number } | null; // button-driven fling for the top card
}

// A single draggable meal card. Right = want it this week (into basket),
// left = not this week. The round buttons in the parent set flingSignal,
// which triggers the same animation + decision as a drag.
export default function SwipeCard({ meal, onDecision, isTop, index, flingSignal }: Props) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-18, 18]);
  const yesOpacity = useTransform(x, [20, 120], [0, 1]);
  const noOpacity = useTransform(x, [-120, -20], [1, 0]);

  const fling = (dir: 1 | -1) => {
    animate(x, dir * 600, { type: "spring", stiffness: 250, damping: 30 });
    setTimeout(() => onDecision(dir === 1), 180);
  };

  // Respond to a button press from the parent (only the top card listens).
  useEffect(() => {
    if (isTop && flingSignal) fling(flingSignal.dir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flingSignal?.at]);

  return (
    <motion.div
      className="mealcard"
      style={{
        x,
        rotate,
        zIndex: 10 - index,
        scale: isTop ? 1 : 1 - index * 0.04,
        y: isTop ? 0 : index * 12,
        pointerEvents: isTop ? "auto" : "none",
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={(_, info) => {
        if (info.offset.x > 110) fling(1);
        else if (info.offset.x < -110) fling(-1);
        else animate(x, 0, { type: "spring", stiffness: 300, damping: 26 });
      }}
    >
      <motion.div className="stamp yes" style={{ opacity: yesOpacity }}>
        Yum
      </motion.div>
      <motion.div className="stamp no" style={{ opacity: noOpacity }}>
        Nope
      </motion.div>

      <div className="photo" style={{ backgroundImage: `url(${meal.image})` }}>
        <div className="meta">
          <div className="pill-row">
            <span className="pill kcal">{meal.nutrition.kcal} kcal</span>
            <span className="pill">⏱ {meal.minutes} min</span>
            <span className="pill">🍽 {meal.servings} servings</span>
          </div>
          <h2>{meal.name}</h2>
          <p>{meal.blurb}</p>
        </div>
      </div>

      <div className="nutri">
        <div>
          <strong>{meal.nutrition.protein}g</strong>
          <small>Protein</small>
        </div>
        <div>
          <strong>{meal.nutrition.carbs}g</strong>
          <small>Carbs</small>
        </div>
        <div>
          <strong>{meal.nutrition.fat}g</strong>
          <small>Fat</small>
        </div>
        <div>
          <strong>{meal.nutrition.kcal}</strong>
          <small>kcal</small>
        </div>
      </div>
    </motion.div>
  );
}
