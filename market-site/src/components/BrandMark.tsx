import { useId } from "react";

type Props = {
  size?: number;
  /** Draws the arrow in when the surrounding `.reveal` comes into view. */
  animated?: boolean;
  className?: string;
};

/**
 * The "Ascend" mark.
 *
 * A lime arrow climbs out of a dotted aurora arc on an ink tile: the search
 * moving forward, one deliberate step at a time. The arc is the field of
 * openings the app scans; the arrow is the move you choose to make.
 */
export function BrandMark({ size = 30, animated = false, className }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const grad = `bm-${uid}`;

  return (
    <svg
      className={`brand-mark${animated ? " is-animated" : ""}${className ? ` ${className}` : ""}`}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={grad} x1="6" y1="26" x2="26" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2EE6FF" />
          <stop offset="0.55" stopColor="#7B61FF" />
          <stop offset="1" stopColor="#FF4FB8" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9.5" fill="#0D0F22" />
      <rect x="1.6" y="1.6" width="28.8" height="28.8" rx="8.9" fill="none" stroke={`url(#${grad})`} strokeWidth="1.2" />
      <path
        className="bm-arc"
        d="M7.5 24.5A17 17 0 0 1 24.5 7.5"
        fill="none"
        stroke={`url(#${grad})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="0.1 4.2"
      />
      <path
        className="bm-out"
        pathLength={1}
        d="M11 21 21.2 10.8M14.2 10.8h7v7"
        fill="none"
        stroke="#D4FF5A"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandLockup({ size = 30 }: { size?: number }) {
  return (
    <>
      <BrandMark size={size} />
      <span className="brand-word">
        AI Job <span>Search</span>
      </span>
    </>
  );
}
