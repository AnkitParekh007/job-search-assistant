import { useId } from "react";

type Props = {
  size?: number;
  className?: string;
};

/**
 * Ascend mark from the market site: coral arrow climbing a dotted aurora
 * arc on an ink tile. Shared so the desktop shell matches the brand.
 */
export function BrandMark({ size = 28, className }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const grad = `bm-${uid}`;

  return (
    <svg
      className={className}
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
        d="M7.5 24.5A17 17 0 0 1 24.5 7.5"
        fill="none"
        stroke={`url(#${grad})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="0.1 4.2"
      />
      <path
        d="M11 21 21.2 10.8M14.2 10.8h7v7"
        fill="none"
        stroke="#FF8C66"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
