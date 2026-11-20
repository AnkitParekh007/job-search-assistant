import {interpolate, useCurrentFrame} from 'remotion';
import {AvatarBubble, AvatarStyle} from './Avatar';
import {AURORA, C, F, M, Words, clamp, prog} from './theme';

/* Building blocks shared by Films 2 and 3 (Film 1 keeps its own copies). */

export type Cue = {start: number; end: number; text: string};
type Viseme = [number, number, number];

// Music sits at 45% under the voice, with 0.3 s ramps.
export const makeDuck = (cues: Cue[]) => (t: number) => {
  let d = 0;
  for (const c of cues) d = Math.max(d, Math.min(1, (t - c.start + 0.3) / 0.3, (c.end + 0.3 - t) / 0.3));
  return 1 - 0.55 * Math.max(0, d);
};

// Split each line into short chunks (sentence first, then max 6 words), timed by character count.
const chunk = (cues: Cue[]) => cues.flatMap((c) => {
  const parts = c.text.match(/[^.?!…:]+[.?!…:]*/g)!.map((p) => p.trim()).filter(Boolean)
    .flatMap((p) => {
      const w = p.split(' ');
      if (w.length <= 6) return [p];
      const mid = Math.ceil(w.length / 2);
      return [w.slice(0, mid).join(' '), w.slice(mid).join(' ')];
    });
  const total = parts.reduce((a, p) => a + p.length, 0);
  let t = c.start;
  return parts.map((p) => {
    const d = ((c.end - c.start) * p.length) / total;
    const out = {start: t, end: t + d, text: p};
    t += d;
    return out;
  });
});

export const Captions: React.FC<{cues: Cue[]}> = ({cues}) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const cur = chunk(cues).find((c) => t >= c.start && t < c.end + 0.12);
  if (!cur) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 1078, display: 'flex', justifyContent: 'center'}}>
      <span style={{fontFamily: F.body, fontWeight: 500, fontSize: 38, color: C.paper, background: 'rgba(7,8,20,.78)',
        padding: '8px 20px', borderRadius: 10, maxWidth: 900, textAlign: 'center', lineHeight: 1.25}}>{cur.text}</span>
    </div>
  );
};

export const CornerAvatar: React.FC<{style: AvatarStyle; visemes: Viseme[]; fadeOutAt: number}> = ({style, visemes, fadeOutAt}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [4, 16, fadeOutAt, fadeOutAt + 14], [0, 1, 1, 0], clamp);
  const lift = interpolate(f, [4, 16], [16, 0], clamp);
  return (
    <div style={{position: 'absolute', right: 52, top: 44 + lift}}>
      <AvatarBubble style={style} visemes={visemes} size={230} opacity={o} />
    </div>
  );
};

export const TextBlock: React.FC<{children: React.ReactNode; top?: number}> = ({children, top = 820}) => (
  <div style={{position: 'absolute', left: M, right: M, top, display: 'flex', flexDirection: 'column', gap: 18}}>{children}</div>
);

export const Feel: React.FC<{text: string; start: number; size?: number; color?: string}> = ({text, start, size = 56, color = C.haze}) => (
  <Words text={text} start={start} size={size} font={F.serif} weight={400} italic color={color} />
);

export const Window: React.FC<{children: React.ReactNode; title: string; topBorder?: string; style?: React.CSSProperties}> = ({children, title, topBorder, style}) => (
  <div style={{background: C.surface, border: `1px solid ${C.line}`, borderRadius: 22, overflow: 'hidden',
    boxShadow: '0 40px 120px rgba(0,0,0,.55)', ...style}}>
    <div style={{height: 4, background: topBorder ?? 'transparent'}} />
    <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '18px 24px', borderBottom: `1px solid ${C.line}`}}>
      {[0, 1, 2].map((i) => <div key={i} style={{width: 13, height: 13, borderRadius: 7, background: C.line}} />)}
      <span style={{fontFamily: F.mono, fontSize: 20, color: C.haze, marginLeft: 12}}>{title}</span>
    </div>
    {children}
  </div>
);

export const Chip: React.FC<{children: React.ReactNode; tone: 'good' | 'gap' | 'done'; p: number}> = ({children, tone, p}) => {
  const col = {good: [C.paper, 'rgba(46,230,255,.10)', 'rgba(46,230,255,.35)'], gap: [C.flare, 'rgba(255,140,102,.12)', 'rgba(255,140,102,.45)'],
    done: [C.paper, 'rgba(123,97,255,.16)', 'rgba(123,97,255,.55)']}[tone];
  return (
    <span style={{fontFamily: F.body, fontSize: 24, fontWeight: 500, padding: '8px 16px', borderRadius: 999, opacity: p,
      transform: `translateY(${(1 - p) * 12}px)`, display: 'inline-block', color: col[0], background: col[1], border: `1px solid ${col[2]}`}}>{children}</span>
  );
};

export const Label: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{fontFamily: F.mono, fontSize: 20, color: C.haze, margin: '22px 0 12px', letterSpacing: '0.06em'}}>{children}</div>
);

// Fit-scored role row with strengths and a gap, as on the Jobs screen.
export const FitRow: React.FC<{role: string; fit: number; f: number; start: number}> = ({role, fit, f, start}) => {
  const fill = prog(f, start, 24);
  return (
    <div style={{padding: '22px 28px', background: 'rgba(255,140,102,.08)', borderLeft: `4px solid ${C.flare}`}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <span style={{fontFamily: F.body, fontWeight: 600, fontSize: 32, color: C.paper}}>{role}</span>
        <span style={{fontFamily: F.mono, fontSize: 28, color: C.flare}}>Fit {Math.round(fit * fill)}</span>
      </div>
      <div style={{height: 8, borderRadius: 4, background: C.cellEmpty, marginTop: 14}}>
        <div style={{height: 8, borderRadius: 4, width: `${fit * fill}%`, background: AURORA}} />
      </div>
    </div>
  );
};

export const Toggle: React.FC<{on: number; label: string; sub: string}> = ({on, label, sub}) => (
  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '30px 32px'}}>
    <div>
      <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 32, color: C.paper}}>{label}</div>
      <div style={{fontFamily: F.body, fontSize: 26, color: C.haze, marginTop: 8}}>{sub}</div>
    </div>
    <div style={{width: 104, height: 58, borderRadius: 29, background: on > 0.5 ? C.flare : C.line, position: 'relative', flexShrink: 0}}>
      <div style={{position: 'absolute', top: 5, left: 5 + on * 46, width: 48, height: 48, borderRadius: 24, background: C.paper}} />
    </div>
  </div>
);

// Pointer arrow for UI recreations.
export const Cursor: React.FC<{x: number; y: number; press?: boolean}> = ({x, y, press}) => (
  <svg width="34" height="44" viewBox="0 0 34 44" style={{position: 'absolute', left: x, top: y, transform: `scale(${press ? 0.9 : 1})`, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.5))'}}>
    <path d="M3 3 L3 34 L11 26 L17 40 L23 37 L17 24 L28 24 Z" fill={C.paper} stroke={C.ink} strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

export const AscendMark: React.FC<{size: number; draw: number; id: string}> = ({size, draw, id}) => (
  <svg width={size} height={size} viewBox="0 0 32 32">
    <defs>
      <linearGradient id={id} x1="6" y1="26" x2="26" y2="6" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={C.cyan} /><stop offset="0.55" stopColor={C.violet} /><stop offset="1" stopColor={C.magenta} />
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="30" height="30" rx="9.5" fill="#0D0F22" opacity={draw} />
    <rect x="1.6" y="1.6" width="28.8" height="28.8" rx="8.9" fill="none" stroke={`url(#${id})`} strokeWidth="1.2" opacity={draw} />
    <path d="M7.5 24.5A17 17 0 0 1 24.5 7.5" fill="none" stroke={`url(#${id})`} strokeWidth="2.2" strokeLinecap="round" strokeDasharray="0.1 4.2" opacity={draw} />
    <path d="M11 21 21.2 10.8M14.2 10.8h7v7" fill="none" stroke={C.flare} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
      pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
  </svg>
);

// Shared end card: mark (already placed by the scene), closing line, product, CTA, URL, disclaimer.
export const EndCard: React.FC<{line: string; cta: string; start: number}> = ({line, cta, start}) => {
  const f = useCurrentFrame();
  const card = prog(f, start, 15);
  return (
    <div style={{position: 'absolute', left: M, right: M, top: 500, opacity: card, transform: `translateY(${(1 - card) * 24}px)`}}>
      <Words text={line} start={start} size={84} weight={800} />
      <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 38, color: C.paper, marginTop: 46}}>AI Job Search Assistant</div>
      <div style={{fontFamily: F.body, fontSize: 36, color: C.flare, marginTop: 6}}>{cta}</div>
      <div style={{fontFamily: F.mono, fontSize: 28, color: C.haze, marginTop: 26}}>job-search-assistant.rebound-ops.org</div>
      <div style={{fontFamily: F.body, fontSize: 24, color: C.dim, marginTop: 40}}>Dramatization. Results vary. You submit your own applications.</div>
    </div>
  );
};
