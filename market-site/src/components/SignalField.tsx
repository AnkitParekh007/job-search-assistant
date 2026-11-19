import { useId } from "react";

/**
 * Hero graphic: a stream of postings (left) converges through the ranking
 * lens (centre) into a short, scored shortlist (right) — the product story in
 * one picture. Pure SVG/CSS so it prerenders and needs no JS to animate.
 */

const LENS = { x: 250, y: 240 };
const INPUTS = [36, 82, 124, 170, 212, 268, 310, 356, 398, 444];
const OUTPUTS = [128, 240, 352];

const SHORTLIST = [
  { score: 94, role: "Product Engineer", org: "Northwind Labs", tag: "Remote · EU" },
  { score: 91, role: "Design Engineer", org: "Halcyon", tag: "Hybrid · Berlin" },
  { score: 88, role: "Frontend Lead", org: "Orbital Health", tag: "Remote", pending: true },
];

export function SignalField() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  return (
    <div className="signal" aria-hidden="true">
      <div className="signal-orb orb-a" />
      <div className="signal-orb orb-b" />
      <div className="signal-orb orb-c" />
      <div className="signal-grid" />

      <svg className="signal-svg" viewBox="0 0 520 480" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={`${uid}-in`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="var(--azure)" stopOpacity="0" />
            <stop offset="0.6" stopColor="var(--azure)" stopOpacity="0.45" />
            <stop offset="1" stopColor="var(--violet)" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {INPUTS.map((y, i) => (
          <path
            key={`p${y}`}
            id={`${uid}-p${i}`}
            className="signal-in"
            d={`M0 ${y} C 120 ${y}, 150 ${LENS.y}, ${LENS.x} ${LENS.y}`}
            stroke={`url(#${uid}-in)`}
          />
        ))}

        {OUTPUTS.map((y) => (
          <path
            key={`o${y}`}
            className="signal-out"
            d={`M${LENS.x} ${LENS.y} C 300 ${LENS.y}, 300 ${y}, 344 ${y}`}
          />
        ))}

        <g className="signal-dots">
          {INPUTS.flatMap((_, i) =>
            [0, 1].map((k) => {
              const dur = 3.6 + ((i * 7) % 5) * 0.45;
              const begin = -((i * 0.83 + k * dur * 0.5) % dur);
              return (
                <circle key={`${i}-${k}`} r={i % 3 === 0 ? 3.2 : 2.4} className={`dot-${i % 3}`}>
                  <animateMotion
                    dur={`${dur}s`}
                    begin={`${begin}s`}
                    repeatCount="indefinite"
                    keyPoints="0;1"
                    keyTimes="0;1"
                    calcMode="spline"
                    keySplines="0.45 0 0.8 1"
                  >
                    <mpath href={`#${uid}-p${i}`} />
                  </animateMotion>
                  <animate
                    attributeName="opacity"
                    values="0;1;1;0"
                    keyTimes="0;0.15;0.85;1"
                    dur={`${dur}s`}
                    begin={`${begin}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              );
            })
          )}
        </g>

        {/* static scatter for reduced motion */}
        <g className="signal-static">
          {INPUTS.map((y, i) => (
            <circle key={y} cx={30 + ((i * 37) % 120)} cy={y} r={2.6} />
          ))}
        </g>
      </svg>

      <div className="signal-lens">
        <div className="lens-ring" />
        <div className="lens-core">
          <span className="lens-label">rank</span>
          <span className="lens-count">
            142<em>→</em>3
          </span>
        </div>
      </div>

      <div className="signal-tag tag-scan">
        <span className="pulse-dot" /> scanning 142 postings
      </div>

      <ol className="shortlist">
        {SHORTLIST.map((job, i) => (
          <li key={job.org} className={`short-card${job.pending ? " is-pending" : ""}`} style={{ ["--i" as string]: i }}>
            <span className="score" style={{ ["--s" as string]: job.score }}>
              <b>{job.score}</b>
            </span>
            <span className="short-body">
              <strong>{job.role}</strong>
              <span>
                {job.org} · {job.tag}
              </span>
              {job.pending ? <span className="approve-pill">Awaiting your OK</span> : null}
            </span>
          </li>
        ))}
      </ol>

      <div className="signal-tag tag-provider">
        <span className="mono">via</span>
        <span className="provider-swap">
          <span>Claude Code</span>
          <span>OpenAI Codex</span>
        </span>
      </div>
    </div>
  );
}
