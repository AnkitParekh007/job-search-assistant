import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {C, F, Grain, M, Words, clamp, enter, exitEase, prog} from './theme';
import {
  ApprovalCard, AscendMark, Btn, Chip, Cursor, EndCard, Feel, FilmProps, FilmShell, Label, Note, PipelineBoard,
  RankedJob, TextBlock, Window,
} from './shared';
import {KitchenMorning, NightWindow, Scrim} from './Illustrations';

/*
  Film 1 · Commit History · Daniel Okafor (fictional) · ~37 s
  Story: an engineer off work for 14 months for health reasons; nine résumés, nothing back.
  Product (from 0:11): workspace setup, Jobs ranking with gaps, Studio drafts behind an approval gate,
  interview practice and the pipeline. Ending: he submits on the employer's own site himself.
  No employer is named, no offer is shown, no outcome is claimed.
*/

const ROLE = 'Applied AI Engineer';
const CO = 'Larkspur Labs (sample)';

/* ---------- contribution grid ---------- */
const COLS = 61, ROWS = 7, CELL = 22, STEP = 28;
const Grid: React.FC<{fill?: (col: number, row: number) => string; build?: number; top?: number}> = ({fill, build = 1, top = 300}) => {
  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  return (
    <div style={{position: 'absolute', left: M, top, width: COLS * STEP}}>
      <div style={{position: 'relative', height: 34, fontFamily: F.mono, fontSize: 22, color: C.dim}}>
        {months.map((m, i) => <span key={i} style={{position: 'absolute', left: i * (COLS / 14) * STEP}}>{m}</span>)}
      </div>
      <div style={{position: 'relative', height: ROWS * STEP}}>
        {new Array(COLS * ROWS).fill(0).map((_, k) => {
          const col = Math.floor(k / ROWS), row = k % ROWS;
          return <div key={k} style={{position: 'absolute', left: col * STEP, top: row * STEP, width: CELL, height: CELL, borderRadius: 3,
            background: fill ? fill(col, row) : col < 2 ? C.cellFaint : C.cellEmpty, opacity: col / COLS < build ? 1 : 0}} />;
        })}
      </div>
    </div>
  );
};

/* 1 · Empty grid */
const EmptyGrid: React.FC = () => {
  const f = useCurrentFrame();
  const build = interpolate(f, [0, 16], [0, 1], clamp);
  const cursorOn = f > 30 && Math.floor((f - 30) / 6) % 2 === 0;
  return (
    <AbsoluteFill>
      <Grid build={build} />
      <TextBlock top={620}>
        <Words text="14 months." start={8} size={104} weight={800} />
        <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
          <Words text="0 commits." start={12} size={104} weight={800} style={{marginRight: -24}} />
          <div style={{width: 9, height: 96, background: C.paper, opacity: cursorOn ? 1 : 0}} />
        </div>
      </TextBlock>
      <Grain />
    </AbsoluteFill>
  );
};

/* 2 · Kitchen table, morning (original illustration) */
const Kitchen: React.FC = () => (
  <AbsoluteFill>
    <KitchenMorning />
    <TextBlock top={800}>
      <Words text="I didn't lose my job because of my code." start={4} size={56} />
      <Feel text="I lost it while I was getting better." start={36} size={50} />
    </TextBlock>
    <Grain opacity={0.07} />
  </AbsoluteFill>
);

/* 3 · Nine résumés, nothing back (his own files, not the app) */
const FILES = ['resume_final.pdf', 'resume_final_v2.pdf', 'resume_final_v3.pdf', 'resume_final_v4.pdf', 'resume_final_v5.pdf',
  'resume_final_v6.pdf', 'resume_final_v7.pdf', 'resume_final_v8.pdf', 'resume_final_v9.pdf'];
const VersionStack: React.FC = () => {
  const f = useCurrentFrame();
  const collapse = interpolate(f, [82, 96], [1, 0.006], {...clamp, easing: exitEase});
  return (
    <AbsoluteFill style={{background: C.surface}}>
      <div style={{position: 'absolute', left: M, right: M, top: 190, transform: `scaleY(${collapse})`, transformOrigin: '50% 60%'}}>
        <Window title="Finder · Documents" style={{background: C.ink}}>
          <div style={{padding: '8px 0'}}>
            {FILES.map((name, i) => {
              const p = prog(f, 2 + i * 3.6, 10);
              const last = i === FILES.length - 1;
              return (
                <div key={name} style={{display: 'flex', alignItems: 'center', gap: 18, padding: '8px 28px', opacity: p,
                  transform: `translateY(${interpolate(p, [0, 0.7, 1], [-30, 6, 0])}px)`, background: last ? C.surface2 : 'transparent'}}>
                  <svg width="24" height="28" viewBox="0 0 26 30"><path d="M3 2h13l7 7v19H3z" fill="none" stroke={C.dim} strokeWidth="2" strokeLinejoin="round" /></svg>
                  <span style={{fontFamily: F.mono, fontSize: 27, color: last ? C.paper : C.haze}}>{name}</span>
                </div>
              );
            })}
          </div>
        </Window>
      </div>
      <TextBlock top={830}>
        <Words text="Nine résumés." start={30} size={64} weight={800} />
        <Feel text="Nothing back." start={44} size={56} />
      </TextBlock>
      <Grain />
    </AbsoluteFill>
  );
};

/* 4 · Window at night (original illustration) */
const Night: React.FC = () => (
  <AbsoluteFill>
    <NightWindow />
    <TextBlock top={830}>
      <Words text="The gap wasn't on my résumé." start={4} size={56} />
      <Feel text="It was in my head." start={30} size={52} />
    </TextBlock>
    <Grain opacity={0.08} />
  </AbsoluteFill>
);

/* 5 · The decision: he connects a workspace (Onboarding copy from packages/ui) and writes the rule down */
const Decision: React.FC = () => {
  const f = useCurrentFrame();
  const note = prog(f, 26, 14);
  const write = interpolate(f, [34, 70], [0, 1], clamp);
  const under = interpolate(f, [56, 72], [0, 1], {...clamp, easing: enter});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M, right: M, top: 190, opacity: prog(f, 0, 10)}}>
        <Window title="Welcome · Jobzuu" topBorder={C.flare} app>
          <div style={{padding: '26px 30px 30px'}}>
            <div style={{fontFamily: F.display, fontWeight: 800, fontSize: 40, color: C.paper}}>Connect your agent workspace</div>
            <div style={{fontFamily: F.body, fontSize: 25, lineHeight: 1.4, color: C.haze, marginTop: 10}}>
              Choose any folder on this Mac. If it is empty, I will create <span style={{fontFamily: F.mono, fontSize: 22}}>CLAUDE.md</span> and the starter workspace files.
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 20, padding: '16px 18px', borderRadius: 12, border: '1.5px solid rgba(46,230,255,.45)'}}>
              <svg width="26" height="26" viewBox="0 0 26 26"><circle cx="13" cy="13" r="11" fill="none" stroke={C.cyan} strokeWidth="2.4" /><path d="M8 13.5 L11.5 17 L18 9.5" fill="none" stroke={C.cyan} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span style={{fontFamily: F.mono, fontSize: 23, color: C.paper}}>~/job-search</span>
              <div style={{flex: 1}} />
              <Btn>Choose folder</Btn>
            </div>
          </div>
        </Window>
      </div>
      {/* his notebook card, overlapping the window */}
      <div style={{position: 'absolute', left: M + 10, top: 540, width: 470, padding: '26px 30px', borderRadius: 8, background: '#F3ECDD',
        transform: `rotate(-3deg) translateY(${(1 - note) * 40}px)`, opacity: note, boxShadow: '0 30px 60px rgba(0,0,0,.5)'}}>
        <div style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 46, color: '#2A2418', lineHeight: 1.05,
          clipPath: `inset(0 ${(1 - write) * 100}% 0 0)`}}>Treat it like a project.</div>
        <div style={{height: 4, width: `${under * 80}%`, background: C.flare, marginTop: 10, borderRadius: 2}} />
      </div>
      <TextBlock top={850}>
        <Words text="So I stopped." start={6} size={56} />
        <Words text="And treated it like a project." start={40} size={56} color={C.flare} />
      </TextBlock>
    </AbsoluteFill>
  );
};

/* 6 · Where he fits, and where he doesn't yet */
const FitAndGaps: React.FC = () => {
  const f = useCurrentFrame();
  const intro = prog(f, 0, 14);
  const out = interpolate(f, [138, 150], [0, 1], {...clamp, easing: exitEase});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M, right: M, top: 200, opacity: intro * (1 - out), transform: `translateY(${(1 - intro) * 30}px)`}}>
        <Window title="Jobs · Ranked" topBorder={C.flare} app>
          <RankedJob role={ROLE} company={CO} score={78} f={f} start={8}
            fits={['Python services', 'Data pipelines', 'Code review']} gaps={['Production LLM evaluation']} />
          {[['Platform Engineer', 'Northwind Logistics', 71], ['ML Infrastructure Eng.', 'Fernhill Studio', 63]].map(([r, c, s], i) => (
            <div key={r as string} style={{display: 'flex', justifyContent: 'space-between', padding: '14px 28px', borderTop: `1px solid ${C.line}`, opacity: prog(f, 46 + i * 5, 10)}}>
              <span style={{fontFamily: F.body, fontSize: 24, color: C.haze}}>{r} · {c} · sample</span>
              <span style={{fontFamily: F.mono, fontSize: 24, color: C.haze}}>{s}</span>
            </div>
          ))}
        </Window>
      </div>
      <TextBlock top={850}>
        <Words text="See where you fit." start={14} size={56} />
        <Feel text="And where you don't, yet." start={60} size={50} />
      </TextBlock>
    </AbsoluteFill>
  );
};

/* 7 · His words, saved only after he allows it */
const TYPED = '2024–25 · Health leave. Built an eval harness for retrieval models (open source).';
const HisWords: React.FC = () => {
  const f = useCurrentFrame();
  const chars = Math.floor(interpolate(f, [8, 56], [0, TYPED.length], clamp));
  const gate = prog(f, 58, 10);
  const allowed = interpolate(f, [86, 92], [0, 1], clamp);
  const line = (w: string) => <div style={{height: 13, width: w, borderRadius: 7, background: '#D9DBEA', margin: '12px 0'}} />;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M, right: M, top: 190, opacity: prog(f, 0, 10), transform: 'scale(0.9)', transformOrigin: '50% 0'}}>
        <Window title={`Studio · CV draft · ${ROLE}`} topBorder="linear-gradient(90deg,#2EE6FF,#7B61FF 55%,#FF4FB8)" app>
          <div style={{background: '#F4F5FF', margin: 22, borderRadius: 12, padding: '26px 32px', color: '#14162A'}}>
            <div style={{fontFamily: F.display, fontWeight: 800, fontSize: 36}}>Daniel Okafor</div>
            <div style={{fontFamily: F.body, fontSize: 22, color: '#4B4F6E', marginTop: 2}}>Senior Backend Engineer · Python · Distributed systems</div>
            <div style={{fontFamily: F.mono, fontSize: 17, color: '#6B6F8E', marginTop: 18, letterSpacing: '0.06em'}}>EXPERIENCE</div>
            <div style={{fontFamily: F.body, fontSize: 24, lineHeight: 1.35, padding: '8px 12px', margin: '8px -12px', borderRadius: 8,
              background: `rgba(123,97,255,${0.18 * (1 - allowed)})`, minHeight: 66}}>
              {TYPED.slice(0, chars)}
              {chars < TYPED.length && <span style={{display: 'inline-block', width: 3, height: 26, background: '#14162A', verticalAlign: 'middle', marginLeft: 2}} />}
            </div>
            {line('90%')}{line('70%')}
          </div>
          <div style={{padding: '0 22px 22px', opacity: gate, transform: `translateY(${(1 - gate) * 16}px)`}}>
            <ApprovalCard tool="Write" target="applications/larkspur/cv.tex" chosen={allowed} press={f > 82 && f < 87 ? 1 : 0} />
          </div>
        </Window>
      </div>
      <TextBlock top={872}>
        <Words text="Tailored drafts." start={60} size={52} />
        <Feel text="My words. My approval." start={90} size={46} />
      </TextBlock>
    </AbsoluteFill>
  );
};

/* 8 · Practice, track, draft the follow-up (drafts only; the app never sends email) */
const Pipeline: React.FC = () => {
  const f = useCurrentFrame();
  const a = 1 - interpolate(f, [50, 60], [0, 1], clamp);
  const b = prog(f, 54, 12);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M, right: M, top: 210, opacity: prog(f, 0, 10) * a}}>
        <Window title="Interview · Mock interview" app>
          <div style={{padding: '24px 28px 30px'}}>
            <Label>Interviewer asks</Label>
            <Words text="Walk me through the 14 months." start={4} size={34} font={F.body} weight={600} stagger={1} />
            <Label>Questions to ask them</Label>
            {['How does the team evaluate model changes?', 'What would the first 90 days look like?'].map((q, k) => (
              <div key={q} style={{fontFamily: F.body, fontSize: 25, color: C.haze, padding: '6px 0', opacity: prog(f, 16 + k * 6, 10)}}>· {q}</div>
            ))}
          </div>
        </Window>
      </div>
      <div style={{position: 'absolute', left: M, right: M, top: 230, opacity: b}}>
        <Window title="Pipeline" app>
          <PipelineBoard cards={[{title: 'Fernhill · ML Infra', col: 0}, {title: 'Larkspur · Applied AI', col: 1}, {title: 'Northwind · Platform', col: 1}]} />
          <div style={{display: 'flex', gap: 12, alignItems: 'center', padding: '0 28px 24px'}}>
            <Btn primary press={f > 92 && f < 97 ? 1 : 0}>Draft follow-up</Btn>
            <span style={{fontFamily: F.body, fontSize: 22, color: C.haze}}>A draft for you to send. The app never emails.</span>
          </div>
        </Window>
      </div>
      <TextBlock top={850}>
        <div style={{display: 'flex', gap: 28}}>
          <Words text="Practice." start={2} size={60} />
          <Words text="Track." start={40} size={60} />
          <Words text="Follow up." start={78} size={60} />
        </div>
      </TextBlock>
    </AbsoluteFill>
  );
};

/* 9 · He submits on the employer's own site (story; the app never submits) */
const Submit: React.FC = () => {
  const f = useCurrentFrame();
  const cx = interpolate(f, [16, 52], [700, 210], {...clamp, easing: enter});
  const cy = interpolate(f, [16, 52], [560, 318], {...clamp, easing: enter});
  const pressed = f >= 56 && f < 62;
  const sent = f >= 62;
  const field = (label: string, value: string, d: number) => (
    <div style={{opacity: prog(f, d, 10)}}>
      <div style={{fontFamily: F.body, fontSize: 20, color: '#5B6078'}}>{label}</div>
      <div style={{fontFamily: F.body, fontSize: 25, color: '#14162A', border: '1.5px solid #CBD0E0', borderRadius: 8, padding: '10px 14px', marginTop: 4}}>{value}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{background: '#10121F'}}>
      <div style={{position: 'absolute', left: M, right: M, top: 200}}>
        <div style={{background: '#FFFFFF', borderRadius: 18, overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,.55)'}}>
          <div style={{background: '#E9ECF5', padding: '14px 22px', fontFamily: F.mono, fontSize: 20, color: '#5B6078'}}>careers.example.com/apply</div>
          <div style={{padding: '24px 30px 30px', display: 'flex', flexDirection: 'column', gap: 14}}>
            <div style={{fontFamily: F.display, fontWeight: 800, fontSize: 32, color: '#14162A'}}>{ROLE} · Apply</div>
            {field('Full name', 'Daniel Okafor', 4)}
            {field('CV', 'cv-larkspur.pdf · reviewed', 8)}
            <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 6}}>
              <span style={{fontFamily: F.body, fontWeight: 700, fontSize: 26, padding: '14px 28px', borderRadius: 10,
                background: sent ? '#2F7D5B' : '#1F2A5C', color: '#fff', transform: `scale(${pressed ? 0.96 : 1})`}}>{sent ? 'Submitted ✓' : 'Submit application'}</span>
            </div>
          </div>
        </div>
        <Cursor x={cx} y={cy} press={pressed} />
      </div>
      <TextBlock top={830}>
        <Words text="I hit submit myself." start={10} size={58} />
        <Feel text="This time, I knew it was ready." start={64} size={50} />
      </TextBlock>
    </AbsoluteFill>
  );
};

/* 10 · The grid fills again (he's writing code again) → Ascend + end card */
const auroraAt = (t: number) => {
  const stops = [[46, 230, 255], [123, 97, 255], [255, 79, 184]];
  const x = t * 2, i = Math.min(1, Math.floor(x)), k = x - i;
  return `rgb(${stops[i].map((v, j) => Math.round(v + (stops[i + 1][j] - v) * k)).join(',')})`;
};
const GridToAscend: React.FC = () => {
  const f = useCurrentFrame();
  const filled = interpolate(f, [0, 36], [0, 36], clamp);
  const morph = interpolate(f, [44, 68], [0, 1], {...clamp, easing: enter});
  return (
    <AbsoluteFill>
      <div style={{opacity: 1 - morph, transform: `scale(${1 - morph * 0.6})`, transformOrigin: '50% 30%'}}>
        <Grid top={300} fill={(col, row) => {
          if (col >= filled) return col < 2 ? C.cellFaint : C.cellEmpty;
          if (random(`c${col}-${row}`) <= 0.28) return C.cellFaint;
          return col < 8 ? C.flare : auroraAt(Math.min(1, (col - 8) / 28));
        }} />
      </div>
      <div style={{position: 'absolute', left: M, top: 160, transform: `scale(${0.6 + morph * 0.4})`, transformOrigin: '0 0', opacity: morph}}>
        <AscendMark size={170} draw={morph} id="ag1" />
      </div>
      <EndCard line="Run your comeback like a project." start={60} />
    </AbsoluteFill>
  );
};

export const FILM1_SCENES = {grid: EmptyGrid, vgrid: EmptyGrid, kitchen: Kitchen, stack: VersionStack, night: Night, decision: Decision, fit: FitAndGaps,
  words: HisWords, pipeline: Pipeline, send: Submit, end: GridToAscend};

export const Film1: React.FC<FilmProps> = (p) => <FilmShell compId="Film1" scenes={FILM1_SCENES} {...p} />;
export const Film1Short: React.FC<FilmProps> = (p) => <FilmShell compId="Film1Short" scenes={FILM1_SCENES} {...p} />;
export const Film1Vertical: React.FC<FilmProps> = (p) => <FilmShell compId="Film1Vertical" scenes={FILM1_SCENES} {...p} />;
