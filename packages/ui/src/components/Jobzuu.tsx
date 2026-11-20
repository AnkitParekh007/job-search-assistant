import { motion, useReducedMotion } from "motion/react";
import jobzuuArt from "../assets/jobzuu.png";

type Mood = "happy" | "thinking" | "done";

type Props = {
  size?: number;
  mood?: Mood;
  className?: string;
};

/**
 * Jobzuu — product mascot (PNG). Soft float only; eyes are baked into the art.
 */
export function Jobzuu({ size = 72, mood = "happy", className }: Props) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "grid",
        placeItems: "center",
      }}
      initial={reduce ? false : { scale: 0.82, opacity: 0, y: 10 }}
      animate={
        reduce
          ? { scale: 1, opacity: 1, y: 0 }
          : {
              scale: mood === "done" ? [1, 1.04, 1] : 1,
              opacity: 1,
              y: mood === "thinking" ? [0, -3, 0] : [0, -5, 0],
              rotate: mood === "thinking" ? [-3, 3, -3] : 0,
            }
      }
      transition={
        reduce
          ? { duration: 0 }
          : {
              scale:
                mood === "done"
                  ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                  : { type: "spring", stiffness: 320, damping: 16 },
              opacity: { duration: 0.28 },
              y: { duration: mood === "thinking" ? 1.5 : 3.2, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
            }
      }
      aria-hidden
    >
      <img
        src={jobzuuArt}
        alt=""
        width={size}
        height={size}
        draggable={false}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          userSelect: "none",
          pointerEvents: "none",
          // Slightly mute when thinking; keep full punch for happy/done
          filter: mood === "thinking" ? "saturate(0.92) brightness(0.98)" : undefined,
        }}
      />
    </motion.div>
  );
}
