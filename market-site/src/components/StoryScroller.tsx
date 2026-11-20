import { useEffect, useRef, useState } from "react";

type Chapter = {
  n: string;
  stage: string;
  title: string;
  body: string;
  command: string;
};

const CHAPTERS: Chapter[] = [
  {
    n: "01",
    stage: "Discover",
    title: "The search starts wide.",
    body: "Your configured portals, saved searches, and careers pages are scraped into the workspace. New postings land on Today; anything you have already seen stays seen.",
    command: "/scrape",
  },
  {
    n: "02",
    stage: "Rank",
    title: "Then it gets honest.",
    body: "Every posting is scored against your profile, with the reasoning kept beside the number. You compare side by side, and a failed run never pretends it finished.",
    command: "/rank",
  },
  {
    n: "03",
    stage: "Apply",
    title: "Drafts wait for your yes.",
    body: "Application Studio drafts a tailored CV and cover letter, compiles the PDFs from TeX, and stops at an approval gate. Nothing is marked sent until you say so.",
    command: "/apply",
  },
  {
    n: "04",
    stage: "Track",
    title: "Every outcome, on file.",
    body: "The tracker CSV, interview packs, and Gmail status proposals keep the pipeline current, all in plain files that other tools can read.",
    command: "/outcome",
  },
];

/** Sticky, scroll-driven walkthrough of the four pipeline stages. */
export function StoryScroller() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="story" style={{ ["--active" as string]: active }}>
      <div className="story-stage" aria-hidden="true">
        <div className="stage-frame">
          <div className="stage-top">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
            <span className="stage-path mono">~/jobzuu-workspace · {CHAPTERS[active].command}</span>
          </div>
          <div className="stage-rail">
            {CHAPTERS.map((c, i) => (
              <span key={c.stage} className={i === active ? "is-on" : i < active ? "is-done" : undefined}>
                {c.stage}
              </span>
            ))}
          </div>
          <div className="stage-body">
            {CHAPTERS.map((c, i) => (
              <div key={c.stage} className={`stage-scene${i === active ? " is-on" : ""}`}>
                <StageVisual stage={i} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <ol className="story-steps">
        {CHAPTERS.map((c, i) => (
          <li
            key={c.stage}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-index={i}
            className={`story-step${i === active ? " is-on" : ""}`}
          >
            <p className="step-meta">
              <span className="step-n">{c.n}</span>
              <span>{c.stage}</span>
              <code>{c.command}</code>
            </p>
            <h3>{c.title}</h3>
            <p>{c.body}</p>
            <div className="step-visual" aria-hidden="true">
              <StageVisual stage={i} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

const POSTINGS = [
  ["Senior Product Engineer", "Northwind Labs", "careers page"],
  ["Design Engineer", "Halcyon", "job board"],
  ["Frontend Lead", "Orbital Health", "saved search"],
  ["Staff Engineer, Platform", "Kestrel", "job board"],
  ["UI Engineer", "Lumen & Co", "careers page"],
];

const RANKED = [
  ["Northwind Labs", 94],
  ["Halcyon", 91],
  ["Orbital Health", 88],
  ["Kestrel", 72],
  ["Lumen & Co", 58],
] as const;

const TRACK: [string, string[]][] = [
  ["Applied", ["Northwind Labs", "Halcyon"]],
  ["Interview", ["Orbital Health"]],
  ["Offer", ["Kestrel"]],
];

export function StageVisual({ stage }: { stage: number }) {
  if (stage === 0) {
    return (
      <div className="viz viz-discover">
        <div className="scan-beam" />
        {POSTINGS.map(([role, org, src], i) => (
          <div key={org} className="post-row" style={{ ["--i" as string]: i }}>
            <span className="post-logo">{org[0]}</span>
            <span className="post-text">
              <strong>{role}</strong>
              <span>{org}</span>
            </span>
            <span className={`post-src${i < 3 ? " is-new" : ""}`}>{i < 3 ? "new" : src}</span>
          </div>
        ))}
      </div>
    );
  }

  if (stage === 1) {
    return (
      <div className="viz viz-rank">
        {RANKED.map(([org, score], i) => (
          <div key={org} className={`rank-row${i === 0 ? " is-top" : ""}`} style={{ ["--i" as string]: i }}>
            <span className="rank-n mono">#{i + 1}</span>
            <span className="rank-org">{org}</span>
            <span className="rank-bar">
              <i style={{ ["--w" as string]: `${score}%` }} />
            </span>
            <b className="mono">{score}</b>
          </div>
        ))}
        <p className="rank-why mono">
          <span>why #1</span> stack match · seniority · remote · salary band
        </p>
      </div>
    );
  }

  if (stage === 2) {
    return (
      <div className="viz viz-apply">
        <div className="doc">
          <div className="doc-head">
            <span className="mono">cv_northwind.tex</span>
            <span className="doc-badge">PDF ✓</span>
          </div>
          {[92, 70, 84, 58, 76, 40].map((w, i) => (
            <span key={i} className="doc-line" style={{ ["--w" as string]: `${w}%`, ["--i" as string]: i }} />
          ))}
        </div>
        <div className="gate">
          <p className="gate-title">
            <span className="pulse-dot" /> Approval needed
          </p>
          <p className="gate-body mono">write · applications/northwind/cover_letter.pdf</p>
          <div className="gate-actions">
            <span className="gate-deny">Deny</span>
            <span className="gate-ok">Approve</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="viz viz-track">
      {TRACK.map(([col, items], c) => (
        <div key={col} className="track-col" style={{ ["--i" as string]: c }}>
          <p className="track-head">
            {col}
            <span className="mono">{items.length}</span>
          </p>
          {items.map((it) => (
            <span key={it} className={`track-card${c === 2 ? " is-win" : ""}`}>
              {it}
            </span>
          ))}
        </div>
      ))}
      <p className="track-foot mono">tracker.csv · updated 2 min ago · gmail proposed 1 change</p>
    </div>
  );
}
