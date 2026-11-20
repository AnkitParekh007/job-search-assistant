import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, random} from 'remotion';
import cues from './film1-vo.json';
import visemes from './film1-visemes.json';
import {AVATARS, AvatarBubble} from './Avatar';
import {AURORA, C, F, Grain, LiveSlot, M, Tag, Words, clamp, enter, exitEase, prog} from './theme';

export const FILM1_FRAMES = 1200; // 40 s at 30 fps

type Props = {company: string; showSlates: boolean; withMusic: boolean; withVO: boolean; captions: boolean; avatar: boolean};

// Scene starts (frames), from the shot list.
const S = {grid: 0, kitchen: 60, stack: 180, window: 330, decision: 420, fit: 510, words: 660, pipeline: 780, offer: 900, end: 1050};

export const Film1: React.FC<Props> = ({company, showSlates, withMusic, withVO, captions, avatar}) => (
  <AbsoluteFill style={{background: C.ink}}>
    <Sequence from={S.grid} durationInFrames={60}><EmptyGrid /></Sequence>
    <Sequence from={S.kitchen} durationInFrames={120}><Kitchen show={showSlates} /></Sequence>
    <Sequence from={S.stack} durationInFrames={150}><VersionStack /></Sequence>
    <Sequence from={S.window} durationInFrames={90}><WindowNight show={showSlates} /></Sequence>
    <Sequence from={S.decision} durationInFrames={90}><Decision show={showSlates} /></Sequence>
    <Sequence from={S.fit} durationInFrames={150}><FitAndGaps /></Sequence>
    <Sequence from={S.words} durationInFrames={120}><HisWords /></Sequence>
    <Sequence from={S.pipeline} durationInFrames={120}><Pipeline /></Sequence>
    <Sequence from={S.offer} durationInFrames={150}><Offer company={company} show={showSlates} /></Sequence>
    <Sequence from={S.end} durationInFrames={150}><GridToAscend /></Sequence>
    {withMusic && <Audio src={staticFile('film1-score.wav')} volume={(f) => (withVO ? duck(f / 30) : 1)} />}
    {withVO && <Audio src={staticFile('film1-vo.wav')} />}
    {captions && <Captions />}
    {avatar && <CornerAvatar />}
  </AbsoluteFill>
);

/* ---------- voiceover: ducking + burned-in captions ---------- */

type Cue = {start: number; end: number; text: string};
const CUES = cues as Cue[];

// Music sits at 45% under the voice, with 0.3 s ramps.
const duck = (t: number) => {
  let d = 0;
  for (const c of CUES) d = Math.max(d, Math.min(1, (t - c.start + 0.3) / 0.3, (c.end + 0.3 - t) / 0.3));
  return 1 - 0.55 * Math.max(0, d);
};

// Split each line into short chunks (sentence first, then max 6 words), timed by character count.
const CHUNKS = CUES.flatMap((c) => {
  const parts = c.text.match(/[^.?!…]+[.?!…]*/g)!.map((p) => p.trim()).filter(Boolean)
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
    const chunk = {start: t, end: t + d, text: p};
    t += d;
    return chunk;
  });
});

const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const cur = CHUNKS.find((c) => t >= c.start && t < c.end + 0.12);
  if (!cur) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 1078, display: 'flex', justifyContent: 'center'}}>
      <span style={{fontFamily: F.body, fontWeight: 500, fontSize: 38, color: C.paper, background: 'rgba(7,8,20,.78)',
        padding: '8px 20px', borderRadius: 10, maxWidth: 900, textAlign: 'center', lineHeight: 1.25}}>{cur.text}</span>
    </div>
  );
};

// Daniel's 3D presenter, top-right; fades out as the end card arrives.
const CornerAvatar: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [4, 16, S.end + 30, S.end + 44], [0, 1, 1, 0], clamp);
  const lift = interpolate(f, [4, 16], [16, 0], clamp);
  return (
    <div style={{position: 'absolute', right: 52, top: 44 + lift}}>
      <AvatarBubble style={AVATARS.daniel} visemes={visemes as [number, number, number][]} size={230} opacity={o} />
    </div>
  );
};

/* ---------- shared pieces ---------- */

const COLS = 61; // ~14 months of weeks
const ROWS = 7;
const CELL = 22;
const STEP = 28; // grid bleeds off the right edge, like a camera pushed in

const Grid: React.FC<{fill?: (col: number, row: number) => string; build?: number; top?: number}> = ({fill, build = 1, top = 330}) => {
  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  return (
    <div style={{position: 'absolute', left: M, top, width: COLS * STEP}}>
      <div style={{position: 'relative', height: 34, fontFamily: F.mono, fontSize: 22, color: C.dim}}>
        {months.map((m, i) => <span key={i} style={{position: 'absolute', left: i * (COLS / 14) * STEP}}>{m}</span>)}
      </div>
      <div style={{position: 'relative', height: ROWS * STEP}}>
        {new Array(COLS * ROWS).fill(0).map((_, k) => {
          const col = Math.floor(k / ROWS);
          const row = k % ROWS;
          const visible = col / COLS < build;
          return <div key={k} style={{position: 'absolute', left: col * STEP, top: row * STEP, width: CELL, height: CELL,
            borderRadius: 3, background: fill ? fill(col, row) : col < 2 ? C.cellFaint : C.cellEmpty, opacity: visible ? 1 : 0}} />;
        })}
      </div>
    </div>
  );
};

const TextBlock: React.FC<{children: React.ReactNode; top?: number}> = ({children, top = 820}) => (
  <div style={{position: 'absolute', left: M, right: M, top, display: 'flex', flexDirection: 'column', gap: 18}}>{children}</div>
);

const Feel: React.FC<{text: string; start: number; size?: number}> = ({text, start, size = 64}) => (
  <Words text={text} start={start} size={size} font={F.serif} weight={400} italic color={C.haze} />
);

const Window: React.FC<{children: React.ReactNode; title: string; topBorder?: string; style?: React.CSSProperties}> = ({children, title, topBorder, style}) => (
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

/* ---------- 1 · Empty grid (0:00–0:02) ---------- */

const EmptyGrid: React.FC = () => {
  const f = useCurrentFrame();
  const build = interpolate(f, [0, 18], [0, 1], clamp);
  const cursorOn = f > 34 && Math.floor((f - 34) / 6) % 2 === 0 && f < 58;
  return (
    <AbsoluteFill>
      <Tag>Dramatization</Tag>
      <Grid build={build} />
      <TextBlock top={720}>
        <Words text="14 months." start={14} size={104} weight={800} />
        <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
          <Words text="0 commits." start={18} size={104} weight={800} style={{marginRight: -24}} />
          <div style={{width: 9, height: 96, background: C.paper, opacity: cursorOn ? 1 : 0}} />
        </div>
      </TextBlock>
      <Grain />
    </AbsoluteFill>
  );
};

/* ---------- 2 · Kitchen table (0:02–0:06) ---------- */

const Kitchen: React.FC<{show: boolean}> = ({show}) => {
  const f = useCurrentFrame();
  const push = interpolate(f, [0, 120], [1, 1.03]);
  const screen = interpolate(f, [96, 120], [0, 1], {...clamp, easing: enter});
  return (
    <LiveSlot mood="overcast" label="Kitchen table · morning · laptop opens" show={show}>
      <AbsoluteFill style={{transform: `scale(${push})`}}>
        {/* laptop glow, which becomes the screen for the match cut */}
        <div style={{position: 'absolute', left: 540 - 200 - screen * 340, top: 360 - screen * 260,
          width: 400 + screen * 680, height: 250 + screen * 740, borderRadius: 18 - screen * 18,
          background: `linear-gradient(160deg, #2B3150, ${C.surface})`, opacity: 0.55 + screen * 0.45,
          boxShadow: '0 0 160px rgba(140,160,255,.18)'}} />
      </AbsoluteFill>
      <TextBlock top={790}>
        <Words text="I didn't lose my job because of my code." start={6} size={60} />
        <Feel text="I lost it while I was getting better." start={42} />
      </TextBlock>
      <Grain />
    </LiveSlot>
  );
};

/* ---------- 3 · Version stack (0:06–0:11) ---------- */

const FILES = ['resume_final.pdf', 'resume_final_v2.pdf', 'resume_final_v3.pdf', 'resume_final_v4.pdf', 'resume_final_v5.pdf',
  'resume_final_v6.pdf', 'resume_final_v7.pdf', 'resume_final_v8.pdf', 'resume_final_v9.pdf'];
const REJECTIONS = ['Update on your application', 'Thank you for your interest', 'Regarding your application', 'Your application status'];

const VersionStack: React.FC = () => {
  const f = useCurrentFrame();
  const collapse = interpolate(f, [132, 150], [1, 0.006], {...clamp, easing: exitEase});
  return (
    <AbsoluteFill style={{background: C.surface}}>
      {REJECTIONS.map((r, i) => {
        const p = prog(f, 20 + i * 18, 30);
        return <div key={i} style={{position: 'absolute', left: M + 40 + i * 30, top: 120 + i * 64 + (1 - p) * 120,
          fontFamily: F.body, fontSize: 34, color: C.haze, opacity: p * 0.45, filter: 'blur(3px)'}}>{r}</div>;
      })}
      <div style={{position: 'absolute', left: M, right: M, top: 290, transform: `scaleY(${collapse})`, transformOrigin: '50% 60%'}}>
        <Window title="Documents" style={{background: C.ink}}>
          <div style={{padding: '10px 0'}}>
            {FILES.map((name, i) => {
              const p = prog(f, 4 + i * 2.4 * 2, 12);
              const over = interpolate(p, [0, 0.7, 1], [-30, 6, 0]);
              const last = i === FILES.length - 1;
              return (
                <div key={name} style={{display: 'flex', alignItems: 'center', gap: 18, padding: '10px 28px', opacity: p,
                  transform: `translateY(${over}px)`, background: last ? C.surface2 : 'transparent'}}>
                  <svg width="26" height="30" viewBox="0 0 26 30"><path d="M3 2h13l7 7v19H3z" fill="none" stroke={C.dim} strokeWidth="2" strokeLinejoin="round" /></svg>
                  <span style={{fontFamily: F.mono, fontSize: 28, color: last ? C.paper : C.haze}}>{name}</span>
                </div>
              );
            })}
          </div>
        </Window>
      </div>
      <TextBlock top={930}>
        <Words text="Recovered. Ready. Invisible." start={40} stagger={8} size={64} style={{opacity: collapse > 0.5 ? 1 : 0}} />
      </TextBlock>
      <Grain />
    </AbsoluteFill>
  );
};

/* ---------- 4 · Window at night (0:11–0:14) ---------- */

const WindowNight: React.FC<{show: boolean}> = ({show}) => {
  const f = useCurrentFrame();
  const dip = interpolate(f, [84, 90], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <LiveSlot mood="night" label="Window at night · phone glow · rack focus" show={show}>
        <div style={{position: 'absolute', left: 470, top: 520, width: 140, height: 220, borderRadius: 70,
          background: 'radial-gradient(closest-side, rgba(150,175,255,.32), transparent)', filter: 'blur(10px)'}} />
        <TextBlock top={820}>
          <Words text="The gap wasn't on my résumé." start={6} size={60} />
          <Feel text="It was in my head." start={36} />
        </TextBlock>
        <Grain />
      </LiveSlot>
      <AbsoluteFill style={{background: '#000', opacity: dip}} />
    </AbsoluteFill>
  );
};

/* ---------- 5 · The decision (0:14–0:17), first coral ---------- */

const Decision: React.FC<{show: boolean}> = ({show}) => {
  const f = useCurrentFrame();
  const scatter = interpolate(f, [26, 50], [0, 1], {...clamp, easing: enter});
  const underline = interpolate(f, [50, 62], [0, 1], {...clamp, easing: enter});
  const stretch = interpolate(f, [74, 90], [0, 1], {...clamp, easing: enter});
  return (
    <LiveSlot mood="warm" label="Notebook · 'treat it like a project' · pen down" show={show}>
      <TextBlock top={760}>
        <div style={{position: 'relative'}}>
          <Words text="So I stopped applying" start={0} size={60} style={{display: 'inline'}} />
          <span style={{position: 'relative', display: 'inline-block', fontFamily: F.display, fontWeight: 600, fontSize: 60, color: C.paper, letterSpacing: '-0.02em'}}>
            {'everywhere.'.split('').map((ch, i) => {
              const a = random(`a${i}`) * Math.PI * 2;
              const d = scatter * (60 + random(`d${i}`) * 120);
              return <span key={i} style={{display: 'inline-block', opacity: prog(f, 8, 15) * (1 - scatter),
                transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px) rotate(${scatter * (random(`r${i}`) - 0.5) * 90}deg)`}}>{ch}</span>;
            })}
          </span>
        </div>
        <div style={{position: 'relative', display: 'flex', flexWrap: 'wrap'}}>
          <Words text="And started" start={44} size={60} />
          <span style={{position: 'relative'}}>
            <Words text="engineering" start={48} size={60} color={underline > 0.5 ? C.flare : C.paper} />
            <div style={{position: 'absolute', left: 0, bottom: -6, height: 6, borderRadius: 3, background: C.flare,
              width: `calc(${underline * 92}% + ${stretch * 1400}px)`, transform: `translateX(${-stretch * 500}px)`}} />
          </span>
          <Words text="my search." start={54} size={60} />
        </div>
      </TextBlock>
    </LiveSlot>
  );
};

/* ---------- 6 · Fit and gaps (0:17–0:22) ---------- */

const ROLES = [
  {role: 'Applied AI Engineer', fit: 82},
  {role: 'Platform Engineer', fit: 74},
  {role: 'Senior Backend Engineer', fit: 71},
  {role: 'ML Infrastructure Engineer', fit: 63},
];

const Chip: React.FC<{children: React.ReactNode; tone: 'good' | 'gap'; p: number}> = ({children, tone, p}) => (
  <span style={{fontFamily: F.body, fontSize: 24, fontWeight: 500, padding: '8px 16px', borderRadius: 999, opacity: p,
    transform: `translateY(${(1 - p) * 12}px)`, display: 'inline-block',
    color: tone === 'good' ? C.paper : C.flare, background: tone === 'good' ? 'rgba(46,230,255,.10)' : 'rgba(255,140,102,.12)',
    border: `1px solid ${tone === 'good' ? 'rgba(46,230,255,.35)' : 'rgba(255,140,102,.45)'}`}}>{children}</span>
);

const FitAndGaps: React.FC = () => {
  const f = useCurrentFrame();
  const intro = prog(f, 0, 18);
  const sweep = interpolate(f, [40, 56], [0, 1], {...clamp, easing: enter});
  const expand = interpolate(f, [54, 72], [0, 1], {...clamp, easing: enter});
  const zoom = interpolate(f, [134, 150], [1, 2.6], {...clamp, easing: exitEase});
  const zoomFade = interpolate(f, [140, 150], [1, 0], clamp);
  return (
    <AbsoluteFill style={{perspective: 1800}}>
      <div style={{position: 'absolute', left: M - 20, right: M - 20, top: 290, opacity: intro * zoomFade,
        transform: `rotateY(-5deg) rotateX(3deg) translateY(${(1 - intro) * 30}px) scale(${zoom * 0.82})`, transformOrigin: '30% 0%'}}>
        <Window title="Jobs · Ranked" topBorder={C.flare}>
          <div style={{padding: '14px 0'}}>
            {ROLES.map((r, i) => {
              const fill = prog(f, 12 + i * 4, 24);
              const chosen = i === 0;
              return (
                <div key={r.role} style={{position: 'relative', padding: '18px 28px', borderBottom: `1px solid ${C.line}`}}>
                  {chosen && <div style={{position: 'absolute', inset: 0, background: 'rgba(255,140,102,.10)',
                    borderLeft: `4px solid ${C.flare}`, clipPath: `inset(0 ${(1 - sweep) * 100}% 0 0)`}} />}
                  <div style={{position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
                    <span style={{fontFamily: F.body, fontWeight: 600, fontSize: 30, color: C.paper}}>{r.role}</span>
                    <span style={{fontFamily: F.mono, fontSize: 26, color: chosen ? C.flare : C.haze}}>Fit {Math.round(r.fit * fill)}</span>
                  </div>
                  <div style={{position: 'relative', height: 8, borderRadius: 4, background: C.cellEmpty, marginTop: 14}}>
                    <div style={{height: 8, borderRadius: 4, width: `${r.fit * fill}%`, background: chosen ? AURORA : C.dim}} />
                  </div>
                  {chosen && (
                    <div style={{position: 'relative', overflow: 'hidden', height: expand * 210}}>
                      <div style={{fontFamily: F.mono, fontSize: 20, color: C.haze, margin: '22px 0 12px', letterSpacing: '0.06em'}}>WHY IT FITS</div>
                      <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
                        {['Distributed systems', 'Python', 'On-call leadership'].map((s, k) => <Chip key={s} tone="good" p={prog(f, 66 + k * 3, 12)}>{s}</Chip>)}
                      </div>
                      <div style={{fontFamily: F.mono, fontSize: 20, color: C.haze, margin: '22px 0 12px', letterSpacing: '0.06em'}}>GAPS TO ADDRESS</div>
                      <Chip tone="gap" p={prog(f, 80, 12)}>Recent LLM tooling</Chip>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Window>
      </div>
      <TextBlock top={870}>
        <div style={{opacity: zoomFade}}>
          <Words text="See where you fit." start={20} size={60} />
          <div style={{height: 14}} />
          <Feel text="And where you don't yet." start={84} size={56} />
        </div>
      </TextBlock>
    </AbsoluteFill>
  );
};

/* ---------- 7 · His words (0:22–0:26) ---------- */

const TYPED = '2024–25 · Medical leave. Returned full-time; shipped an LLM eval harness.';

const HisWords: React.FC = () => {
  const f = useCurrentFrame();
  const intro = prog(f, 0, 12);
  const chars = Math.floor(interpolate(f, [14, 74], [0, TYPED.length], clamp));
  const diff = interpolate(f, [74, 100], [1, 0], clamp);
  const press = f >= 92 && f < 94 ? 0.97 : 1;
  const approved = f >= 94;
  const out = interpolate(f, [108, 120], [0, 1], {...clamp, easing: exitEase});
  const line = (w: string) => <div style={{height: 14, width: w, borderRadius: 7, background: '#D9DBEA', margin: '14px 0'}} />;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M, right: M, top: 290, opacity: intro, transform: `translateX(${out * 1100}px) scale(0.75)`, transformOrigin: '50% 0%'}}>
        <Window title="Studio · Tailored CV · Applied AI Engineer" topBorder={AURORA}>
          <div style={{background: '#F4F5FF', margin: 26, borderRadius: 12, padding: '34px 38px', color: '#14162A'}}>
            <div style={{fontFamily: F.display, fontWeight: 800, fontSize: 40}}>Daniel Okafor</div>
            <div style={{fontFamily: F.body, fontSize: 24, color: '#4B4F6E', marginTop: 4}}>Senior Backend Engineer · Python · Distributed systems</div>
            <div style={{fontFamily: F.mono, fontSize: 18, color: '#6B6F8E', marginTop: 28, letterSpacing: '0.06em'}}>EXPERIENCE</div>
            {line('92%')}{line('78%')}
            <div style={{fontFamily: F.body, fontSize: 25, lineHeight: 1.4, padding: '10px 12px', margin: '10px -12px', borderRadius: 8,
              background: `rgba(123,97,255,${0.22 * diff})`, minHeight: 72}}>
              {TYPED.slice(0, chars)}
              {chars < TYPED.length && <span style={{display: 'inline-block', width: 3, height: 28, background: '#14162A', verticalAlign: 'middle', marginLeft: 2}} />}
            </div>
            {line('84%')}{line('64%')}
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 26px 26px'}}>
            <span style={{fontFamily: F.body, fontSize: 24, color: C.haze}}>{approved ? 'Approved by you' : 'Review this draft before it is saved'}</span>
            <span style={{fontFamily: F.body, fontWeight: 600, fontSize: 26, padding: '14px 30px', borderRadius: 12, transform: `scale(${press})`,
              background: approved ? C.surface2 : C.flare, color: approved ? C.paper : C.ink, border: approved ? `1px solid ${C.line}` : 'none'}}>
              {approved ? '✓ Approved' : 'Approve'}
            </span>
          </div>
        </Window>
      </div>
      <TextBlock top={890}>
        <Words text="Tailored drafts." start={6} size={60} />
        <Feel text="My words. My approval." start={40} size={56} />
      </TextBlock>
    </AbsoluteFill>
  );
};

/* ---------- 8 · Practice and pipeline (0:26–0:30) ---------- */

const COLS_PIPE = ['Applied', 'Interviewing', 'Final round', 'Offer'];

const Pipeline: React.FC = () => {
  const f = useCurrentFrame();
  // card -> column index over beats (every 30 frames)
  const beat = Math.min(3, Math.floor(f / 30));
  const cards = [
    {t: 'Applied AI Engineer', path: [0, 1, 2, 3]},
    {t: 'Platform Engineer', path: [0, 1, 1, 1]},
    {t: 'Senior Backend Eng.', path: [0, 0, 1, 1]},
    {t: 'ML Infrastructure', path: [0, 0, 0, 0]},
  ];
  const colW = 900 / 4;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M, right: M, top: 290, transform: 'scale(0.8)', transformOrigin: '50% 0%'}}>
        <div style={{display: 'flex', fontFamily: F.mono, fontSize: 20, color: C.haze, letterSpacing: '0.04em'}}>
          {COLS_PIPE.map((c, i) => <div key={c} style={{width: colW, paddingLeft: 8, color: i === 3 && beat === 3 ? C.flare : C.haze}}>{c}</div>)}
        </div>
        <div style={{position: 'relative', height: 560, marginTop: 16}}>
          {COLS_PIPE.map((c, i) => <div key={c} style={{position: 'absolute', left: i * colW, top: 0, width: colW - 12, height: 560,
            borderRadius: 16, background: C.surface, border: `1px solid ${C.line}`}} />)}
          {cards.map((card, i) => {
            const prev = card.path[Math.max(0, beat - 1)];
            const cur = card.path[beat];
            const local = f - beat * 30;
            const p = beat === 0 ? 1 : prog(local, 0, 15);
            const col = prev + (cur - prev) * p;
            const sameCol = cards.slice(0, i).filter((c) => c.path[beat] === cur).length;
            const isHero = i === 0;
            return (
              <div key={card.t} style={{position: 'absolute', left: col * colW + 10, top: 16 + sameCol * 118, width: colW - 32, height: 102,
                borderRadius: 12, background: C.surface2, border: `1px solid ${isHero ? C.flare : C.line}`, padding: '14px 14px',
                boxShadow: isHero ? '0 10px 40px rgba(255,140,102,.18)' : 'none'}}>
                <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 21, color: C.paper, lineHeight: 1.2}}>{card.t}</div>
                <div style={{height: 6, borderRadius: 3, marginTop: 14, width: '70%', background: isHero ? AURORA : C.line}} />
              </div>
            );
          })}
        </div>
      </div>
      <TextBlock top={800}>
        <div style={{display: 'flex', gap: 22}}>
          <Words text="Practice." start={2} size={64} />
          <Words text="Track." start={32} size={64} />
          <Words text="Follow up." start={62} size={64} />
        </div>
        <div style={{fontFamily: F.mono, fontSize: 30, color: C.haze, opacity: prog(f, 66, 12)}}>Pipeline · 3 interviewing</div>
      </TextBlock>
    </AbsoluteFill>
  );
};

/* ---------- 9 · The offer (0:30–0:35) ---------- */

const Offer: React.FC<{company: string; show: boolean}> = ({company, show}) => {
  const f = useCurrentFrame();
  const toFace = f >= 96;
  const mail = (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M, right: M, top: 300}}>
        <Window title="Inbox">
          <div style={{display: 'flex'}}>
            <div style={{width: 230, borderRight: `1px solid ${C.line}`, padding: 18}}>
              {[0, 1, 2, 3, 4].map((i) => <div key={i} style={{height: 12, borderRadius: 6, background: C.line, width: `${80 - i * 8}%`, margin: '18px 0'}} />)}
            </div>
            <div style={{flex: 1, padding: '28px 30px'}}>
              <div style={{fontFamily: F.body, fontSize: 22, color: C.haze}}>Recruiting team</div>
              <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 32, color: C.paper, marginTop: 10, lineHeight: 1.25}}>
                Offer · Applied AI Engineer · {company}
              </div>
              {[96, 88, 92, 60].map((w, i) => <div key={i} style={{height: 12, borderRadius: 6, background: C.line, width: `${w}%`, margin: '20px 0'}} />)}
            </div>
          </div>
        </Window>
      </div>
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      {toFace ? (
        <LiveSlot mood="after" label="Daniel sits back, exhales · partner's hand on shoulder" show={show} />
      ) : mail}
      <TextBlock top={830}>
        <Words text={`Applied AI Engineer at ${company}.`} start={30} size={60} />
        <Feel text="Month 4 of a focused search." start={60} size={56} />
      </TextBlock>
    </AbsoluteFill>
  );
};

/* ---------- 10 · Grid → Ascend + end card (0:35–0:40) ---------- */

const AscendMark: React.FC<{size: number; draw: number}> = ({size, draw}) => (
  <svg width={size} height={size} viewBox="0 0 32 32">
    <defs>
      <linearGradient id="ag" x1="6" y1="26" x2="26" y2="6" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={C.cyan} /><stop offset="0.55" stopColor={C.violet} /><stop offset="1" stopColor={C.magenta} />
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="30" height="30" rx="9.5" fill="#0D0F22" opacity={draw} />
    <rect x="1.6" y="1.6" width="28.8" height="28.8" rx="8.9" fill="none" stroke="url(#ag)" strokeWidth="1.2" opacity={draw} />
    <path d="M7.5 24.5A17 17 0 0 1 24.5 7.5" fill="none" stroke="url(#ag)" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="0.1 4.2" opacity={draw} />
    <path d="M11 21 21.2 10.8M14.2 10.8h7v7" fill="none" stroke={C.flare} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
      pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
  </svg>
);

const auroraAt = (t: number) => {
  const stops = [[46, 230, 255], [123, 97, 255], [255, 79, 184]];
  const x = t * 2; const i = Math.min(1, Math.floor(x)); const k = x - i;
  const c = stops[i].map((v, j) => Math.round(v + (stops[i + 1][j] - v) * k));
  return `rgb(${c.join(',')})`;
};

const GridToAscend: React.FC = () => {
  const f = useCurrentFrame();
  // fill columns, 1 frame per column: coral first, aurora after
  const filled = interpolate(f, [0, 36], [0, 36], clamp); // ~36 columns are on screen
  const morph = interpolate(f, [40, 64], [0, 1], {...clamp, easing: enter});
  const card = prog(f, 66, 15);
  return (
    <AbsoluteFill>
      <div style={{opacity: 1 - morph, transform: `scale(${1 - morph * 0.6})`, transformOrigin: '50% 30%'}}>
        <Grid top={330} fill={(col, row) => {
          if (col >= filled) return col < 2 ? C.cellFaint : C.cellEmpty;
          const lit = random(`c${col}-${row}`) > 0.28;
          if (!lit) return C.cellFaint;
          return col < 8 ? C.flare : auroraAt(Math.min(1, (col - 8) / 28));
        }} />
      </div>
      <div style={{position: 'absolute', left: M, top: 220 - card * 40, transform: `scale(${0.6 + morph * 0.4})`, transformOrigin: '0 0'}}>
        <AscendMark size={200} draw={morph} />
      </div>
      <div style={{position: 'absolute', left: M, right: M, top: 500, opacity: card, transform: `translateY(${(1 - card) * 24}px)`}}>
        <Words text="Run your comeback like a project." start={66} size={88} weight={800} />
        <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 38, color: C.paper, marginTop: 46}}>AI Job Search Assistant</div>
        <div style={{fontFamily: F.body, fontSize: 38, color: C.flare, marginTop: 6}}>Download free · Mac &amp; Windows</div>
        <div style={{fontFamily: F.mono, fontSize: 28, color: C.haze, marginTop: 26}}>job-search-assistant.rebound-ops.org</div>
        <div style={{fontFamily: F.body, fontSize: 24, color: C.dim, marginTop: 40}}>Dramatization. Results vary. You submit your own applications.</div>
      </div>
    </AbsoluteFill>
  );
};
