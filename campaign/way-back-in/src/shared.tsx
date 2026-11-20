import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {AVATARS, AvatarBubble, AvatarStyle} from './Avatar';
import {AURORA, C, F, M, Words, clamp, prog} from './theme';
import films from './films.json';
import {CUES, Cue, VISEMES, Viseme} from './generated';

/* Building blocks shared by all three films and their cutdowns. */

export const FPS = films.fps;
export const CLAIMS = films.claims;
type FilmKey = keyof typeof films.films;
type CompKey = keyof typeof films.compositions;
export type SceneMap = Record<string, React.FC>;

export const layout = (compId: CompKey) => {
  const comp = films.compositions[compId];
  const film = films.films[comp.film as FilmKey];
  let from = 0;
  const scenes = comp.scenes.map((id) => {
    const sc = (film.scenes as Record<string, {frames: number; tag: string[]}>)[id];
    const out = {id, from, frames: sc.frames, tag: sc.tag as [string, string]};
    from += sc.frames;
    return out;
  });
  return {slug: comp.slug, film: comp.film as FilmKey, presenter: film.presenter as keyof typeof AVATARS, scenes, frames: from};
};

export type FilmProps = {music: boolean; voice: boolean; captions: boolean; avatar: boolean};

/** Runs a composition from films.json: scenes in order, the premixed audio, captions, mode tags and the presenter. */
export const FilmShell: React.FC<FilmProps & {compId: CompKey; scenes: SceneMap}> = ({compId, scenes, music, voice, captions, avatar}) => {
  const L = layout(compId);
  const cues = CUES[L.slug];
  const end = L.scenes.find((s) => s.id === 'end');
  const lastSpeech = Math.ceil((cues[cues.length - 1]?.speechEnd ?? 0) * FPS);
  const audio = music && voice ? 'mix' : voice ? 'vo' : music ? 'score' : null;
  return (
    <AbsoluteFill style={{background: C.ink}}>
      {L.scenes.map((s) => {
        const Scene = scenes[s.id];
        if (!Scene) throw new Error(`No component for scene "${s.id}" in ${compId}`);
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={s.frames} name={s.id}>
            <Scene />
            <ModeTag kind={s.tag[0] as 'app' | 'story'} label={s.tag[1]} />
          </Sequence>
        );
      })}
      {audio && <Audio src={staticFile(`audio/${L.slug}-${audio}.wav`)} />}
      {captions && <Captions cues={cues} />}
      {avatar && <CornerAvatar style={AVATARS[L.presenter]} visemes={VISEMES[L.slug]} fadeOutAt={Math.max(lastSpeech + 6, (end?.from ?? L.frames) + 20)} />}
    </AbsoluteFill>
  );
};

/* ---------- labels that separate the story from the product ---------- */

// Top-left on every scene. "app" = a recreation of a real, shipping screen with sample data.
// "story" = dramatized, not the product.
export const ModeTag: React.FC<{kind: 'app' | 'story'; label: string; still?: boolean}> = ({kind, label, still}) => {
  const f = useCurrentFrame();
  const o = still ? 1 : prog(f, 0, 8);
  const app = kind === 'app';
  return (
    <div style={{position: 'absolute', top: 60, left: M, maxWidth: 640, display: 'flex', alignItems: 'center', gap: 12, opacity: o,
      fontFamily: F.mono, fontSize: 21, letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1.3,
      color: app ? C.paper : C.haze, background: app ? 'rgba(46,230,255,.10)' : 'rgba(7,8,20,.72)',
      border: `1.5px solid ${app ? 'rgba(46,230,255,.55)' : C.line}`, padding: '8px 14px', borderRadius: 8}}>
      <span style={{width: 12, height: 12, borderRadius: 6, flexShrink: 0, background: app ? C.cyan : 'transparent',
        border: app ? 'none' : `2px solid ${C.haze}`}} />
      <span>{label}</span>
    </div>
  );
};

/* ---------- captions: pre-wrapped lines from the voiceover build ---------- */

export const Captions: React.FC<{cues: Cue[]}> = ({cues}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const cur = cues.find((c) => t >= c.start && t < c.end);
  if (!cur) return null;
  const o = interpolate(t, [cur.start, cur.start + 0.08, cur.end - 0.06, cur.end], [0, 1, 1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: M - 30, right: M - 30, bottom: 200, display: 'flex', justifyContent: 'center', opacity: o}}>
      <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 42, lineHeight: 1.22, color: C.paper, textAlign: 'center',
        background: 'rgba(7,8,20,.84)', padding: '10px 24px 12px', borderRadius: 12}}>
        {cur.lines.map((l, i) => <div key={i}>{l}</div>)}
      </div>
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

/* ---------- type ---------- */

// Scene copy sits between the window and the caption band.
export const TextBlock: React.FC<{children: React.ReactNode; top?: number}> = ({children, top = 790}) => (
  <div style={{position: 'absolute', left: M, right: M, top, display: 'flex', flexDirection: 'column', gap: 14}}>{children}</div>
);

export const Feel: React.FC<{text: string; start: number; size?: number; color?: string}> = ({text, start, size = 54, color = C.haze}) => (
  <Words text={text} start={start} size={size} font={F.serif} weight={400} italic color={color} />
);

export const Note: React.FC<{children: React.ReactNode; p?: number}> = ({children, p = 1}) => (
  <div style={{fontFamily: F.mono, fontSize: 24, color: C.haze, opacity: p, letterSpacing: '0.02em'}}>{children}</div>
);

/* ---------- app recreations (labels match packages/ui) ---------- */

// app = a recreation of the desktop app (shows the Ascend mark); otherwise a story prop.
export const Window: React.FC<{children: React.ReactNode; title: string; topBorder?: string; style?: React.CSSProperties; app?: boolean}> = ({children, title, topBorder, style, app}) => (
  <div style={{background: C.surface, border: `1px solid ${C.line}`, borderRadius: 22, overflow: 'hidden',
    boxShadow: '0 40px 120px rgba(0,0,0,.55)', ...style}}>
    <div style={{height: 4, background: topBorder ?? 'transparent'}} />
    <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '16px 24px', borderBottom: `1px solid ${C.line}`}}>
      {[0, 1, 2].map((i) => <div key={i} style={{width: 13, height: 13, borderRadius: 7, background: C.line}} />)}
      {app && <AscendMark size={26} draw={1} id={`w-${title.length}`} />}
      <span style={{fontFamily: F.mono, fontSize: 21, color: C.haze, marginLeft: 2}}>{title}</span>
    </div>
    {children}
  </div>
);

export const Chip: React.FC<{children: React.ReactNode; tone: 'good' | 'gap' | 'done' | 'plain'; p?: number; size?: number}> = ({children, tone, p = 1, size = 25}) => {
  const col = {good: [C.paper, 'rgba(46,230,255,.10)', 'rgba(46,230,255,.4)'], gap: [C.flare, 'rgba(255,140,102,.12)', 'rgba(255,140,102,.5)'],
    done: [C.paper, 'rgba(123,97,255,.16)', 'rgba(123,97,255,.55)'], plain: [C.haze, 'transparent', C.line]}[tone];
  return (
    <span style={{fontFamily: F.body, fontSize: size, fontWeight: 500, padding: '8px 16px', borderRadius: 999, opacity: p, whiteSpace: 'nowrap',
      transform: `translateY(${(1 - p) * 12}px)`, display: 'inline-block', color: col[0], background: col[1], border: `1px solid ${col[2]}`}}>{children}</span>
  );
};

export const Label: React.FC<{children: React.ReactNode; color?: string}> = ({children, color = C.haze}) => (
  <div style={{fontFamily: F.mono, fontSize: 21, color, margin: '20px 0 12px', letterSpacing: '0.06em', textTransform: 'uppercase'}}>{children}</div>
);

export const Btn: React.FC<{children: React.ReactNode; primary?: boolean; press?: number; style?: React.CSSProperties}> = ({children, primary, press = 0, style}) => (
  <span style={{fontFamily: F.body, fontWeight: 600, fontSize: 24, padding: '12px 22px', borderRadius: 12, display: 'inline-block', whiteSpace: 'nowrap',
    transform: `scale(${1 - press * 0.05})`, background: primary ? C.flare : C.surface2, color: primary ? C.ink : C.paper,
    border: primary ? 'none' : `1px solid ${C.line}`, ...style}}>{children}</span>
);

// The Jobs screen's score ring: stored /rank score out of 100.
export const ScoreRing: React.FC<{score: number; fill: number; size?: number}> = ({score, fill, size = 96}) => {
  const r = 42, c = 2 * Math.PI * r;
  return (
    <div style={{position: 'relative', width: size, height: size, flexShrink: 0}}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <defs><linearGradient id="ring" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor={C.cyan} /><stop offset=".55" stopColor={C.violet} /><stop offset="1" stopColor={C.magenta} /></linearGradient></defs>
        <circle cx="50" cy="50" r={r} fill="none" stroke={C.cellEmpty} strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="url(#ring)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - (score / 100) * fill)} transform="rotate(-90 50 50)" />
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: F.display, fontWeight: 800, fontSize: size * 0.32, color: C.paper}}>
        {Math.round(score * fill)}
      </div>
    </div>
  );
};

// A ranked job, as the Jobs screen shows it: score ring, stored score, "Why it fits", "Gaps to address".
export const RankedJob: React.FC<{role: string; company: string; score: number; fits: string[]; gaps: string[]; f: number; start: number; gapSlot?: React.ReactNode}> = ({role, company, score, fits, gaps, f, start, gapSlot}) => {
  const fill = prog(f, start, 24);
  return (
    <div style={{padding: '24px 28px 28px'}}>
      <div style={{display: 'flex', gap: 22, alignItems: 'center'}}>
        <ScoreRing score={score} fill={fill} />
        <div style={{minWidth: 0}}>
          <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 32, color: C.paper}}>{role}</div>
          <div style={{fontFamily: F.body, fontSize: 24, color: C.haze, marginTop: 2}}>{company}</div>
          <div style={{fontFamily: F.mono, fontSize: 20, color: C.dim, marginTop: 6, opacity: prog(f, start + 14, 10)}}>Scored {score}/100 by your /rank rubric</div>
        </div>
      </div>
      <Label>Why it fits</Label>
      <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
        {fits.map((s, k) => <Chip key={s} tone="good" p={prog(f, start + 16 + k * 3, 12)}>{s}</Chip>)}
      </div>
      <Label color={C.flare}>Gaps to address</Label>
      <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
        {gapSlot ?? gaps.map((s, k) => <Chip key={s} tone="gap" p={prog(f, start + 28 + k * 3, 12)}>{s}</Chip>)}
      </div>
    </div>
  );
};

// The run console's approval card (RunConsole.tsx · ApprovalCard).
export const ApprovalCard: React.FC<{tool: string; target: string; chosen: number; press?: number}> = ({tool, target, chosen, press = 0}) => (
  <div style={{borderRadius: 16, border: `1.5px solid ${chosen > 0.5 ? C.line : 'rgba(255,140,102,.6)'}`, background: chosen > 0.5 ? C.surface2 : 'rgba(255,140,102,.08)', padding: '20px 24px', opacity: 1 - chosen * 0.55}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 12, fontFamily: F.body, fontWeight: 600, fontSize: 28, color: C.paper}}>
      <svg width="26" height="28" viewBox="0 0 26 28"><path d="M13 2 L23 6 V13 C23 20 18 24 13 26 C8 24 3 20 3 13 V6 Z" fill="none" stroke={C.flare} strokeWidth="2.4" strokeLinejoin="round" /><path d="M13 9 V15 M13 19 V19.5" stroke={C.flare} strokeWidth="2.6" strokeLinecap="round" /></svg>
      {`Allow ${tool}?`}
    </div>
    <div style={{fontFamily: F.body, fontSize: 22, color: C.haze, marginTop: 8}}>Review exactly what will run. Nothing executes until you choose.</div>
    <div style={{fontFamily: F.mono, fontSize: 20, color: C.paper, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, padding: '10px 14px', marginTop: 12}}>{target}</div>
    <div style={{display: 'flex', gap: 12, marginTop: 16}}>
      <Btn primary press={press}>Allow once</Btn>
      <Btn>Deny</Btn>
    </div>
  </div>
);

// Pipeline board (canonical statuses from packages/core STATUSES).
export const PipelineBoard: React.FC<{cards: {title: string; col: number}[]; moving?: {title: string; from: number; to: number; t: number}; cols?: string[]}> = ({cards, moving, cols = ['Drafted', 'Applied', 'Interview']}) => {
  const W = 284, G = 14;
  return (
    <div style={{position: 'relative', display: 'flex', gap: G, padding: 22}}>
      {cols.map((c) => (
        <div key={c} style={{width: W, height: 250, borderRadius: 14, background: C.ink, border: `1px solid ${C.line}`, padding: 14}}>
          <div style={{fontFamily: F.mono, fontSize: 20, color: C.haze, letterSpacing: '0.06em', textTransform: 'uppercase'}}>{c}</div>
        </div>
      ))}
      {cards.map((k, i) => {
        const same = cards.slice(0, i).filter((x) => x.col === k.col).length;
        return <BoardCard key={k.title} title={k.title} x={22 + 14 + k.col * (W + G)} y={22 + 52 + same * 76} />;
      })}
      {moving && <BoardCard title={moving.title} x={22 + 14 + (moving.from + (moving.to - moving.from) * moving.t) * (W + G)}
        y={22 + 52 + cards.filter((x) => x.col === moving.to).length * 76 - Math.sin(moving.t * Math.PI) * 30} hot />}
    </div>
  );
};

const BoardCard: React.FC<{title: string; x: number; y: number; hot?: boolean}> = ({title, x, y, hot}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 256, padding: '12px 14px', borderRadius: 10, background: hot ? C.surface2 : C.surface,
    border: `1.5px solid ${hot ? C.flare : C.line}`, fontFamily: F.body, fontSize: 21, fontWeight: 600, color: C.paper,
    boxShadow: hot ? '0 18px 40px rgba(0,0,0,.5)' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{title}</div>
);

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

// End card. Every claim comes from films.json "claims", which tools/verify_release.py checks against GitHub.
export const EndCard: React.FC<{line: string; start: number}> = ({line, start}) => {
  const f = useCurrentFrame();
  const card = prog(f, start, 15);
  const sub = (d: number) => prog(f, start + d, 12);
  return (
    <div style={{position: 'absolute', left: M, right: M, top: 370, opacity: card, transform: `translateY(${(1 - card) * 24}px)`}}>
      <Words text={line} start={start} size={80} weight={800} />
      <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 38, color: C.paper, marginTop: 36, opacity: sub(8)}}>AI Job Search Assistant</div>
      <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 32, color: C.flare, marginTop: 6, opacity: sub(10)}}>{CLAIMS.price}</div>
      <div style={{fontFamily: F.body, fontSize: 27, color: C.paper, marginTop: 10, lineHeight: 1.3, opacity: sub(12)}}>{CLAIMS.availability}</div>
      <div style={{fontFamily: F.body, fontSize: 25, color: C.haze, marginTop: 6, lineHeight: 1.3, opacity: sub(14)}}>{CLAIMS.requirement}</div>
      <div style={{fontFamily: F.mono, fontSize: 28, color: C.paper, marginTop: 18, opacity: sub(16)}}>{CLAIMS.url}</div>
      <div style={{fontFamily: F.body, fontSize: 22, color: C.haze, marginTop: 22, lineHeight: 1.35, opacity: sub(18)}}>{CLAIMS.disclaimer}</div>
    </div>
  );
};

export {AURORA};
