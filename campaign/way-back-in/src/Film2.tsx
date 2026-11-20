import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, F, Grain, M, Words, clamp, enter, exitEase, prog} from './theme';
import {
  ApprovalCard, AscendMark, Btn, Chip, Cursor, EndCard, Feel, FilmProps, FilmShell, Label, Note, PipelineBoard,
  RankedJob, TextBlock, Toggle, Window,
} from './shared';
import {DeskBackdrop, Monitor, MonthsMontage, Scrim} from './Illustrations';

/*
  Film 2 · Return Date · Priya Raman (fictional) · ~35 s
  Story: a recruiter who always told candidates a break isn't a red flag takes one, then finds coming back hard.
  Product (from 0:07.5): Jobs (found, ranked, gaps), Studio with an approval gate, Interview prep, Pipeline.
  Honest ending: she is back in the search, prepared, and submits applications herself. No offers, no metrics.
*/

const YELLOW = '#F2D16B';
const ROLE = 'Senior Talent Partner';
const CO = 'Meridian Health (sample)';

const PauseIcon: React.FC<{size: number; opacity: number}> = ({size, opacity}) => (
  <div style={{display: 'flex', gap: size * 0.22, opacity}}>
    {[0, 1].map((i) => <div key={i} style={{width: size * 0.26, height: size, borderRadius: size * 0.08, background: C.paper}} />)}
  </div>
);

/* 1 · Her own advice */
const Advice: React.FC = () => (
  <AbsoluteFill>
    <div style={{position: 'absolute', right: M + 20, top: 400}}><PauseIcon size={150} opacity={0.08} /></div>
    <TextBlock top={560}>
      <Words text="For 11 years, I said a career break isn't a red flag." start={4} stagger={3} size={76}
        wordStyle={(w, i) => (i >= 5 ? {fontFamily: F.serif, fontStyle: 'italic', fontWeight: 400, color: C.haze} : undefined)} />
    </TextBlock>
    <Grain />
  </AbsoluteFill>
);

/* 2 · Then I took one (her email, not the app) */
const TookOne: React.FC = () => {
  const f = useCurrentFrame();
  const on = interpolate(f, [8, 14], [0, 1], {...clamp, easing: enter});
  const fade = interpolate(f, [38, 45], [1, 0], clamp);
  return (
    <AbsoluteFill style={{opacity: fade}}>
      <div style={{position: 'absolute', left: M, right: M, top: 330, opacity: prog(f, 0, 8)}}>
        <Window title="Mail · Automatic replies"><Toggle on={on} label="Automatic replies" sub="I'm on a career break. Back in 2026." /></Window>
      </div>
      <TextBlock top={720}>
        <Words text="Then I took one." start={10} size={76} weight={800} />
      </TextBlock>
      <Grain />
    </AbsoluteFill>
  );
};

/* 3 · Eighteen months (original illustrations: tea with her father, the ceramics wheel, a train window) */
const Months: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: interpolate(f, [0, 6], [0, 1], clamp)}}>
      <MonthsMontage />
      <TextBlock top={800}>
        <Words text="18 months." start={4} size={76} weight={800} />
        <Feel text="I'd do it again." start={16} size={60} color={C.paper} />
      </TextBlock>
    </AbsoluteFill>
  );
};

/* 4 · The return: the app's Jobs list, roles found from her saved searches */
const FOUND = [
  ['Senior Talent Partner', 'Meridian Health', 'high'],
  ['Talent Acquisition Lead', 'Northwind Logistics', 'medium'],
  ['Recruiting Manager', 'Fernhill Studio', 'medium'],
];
export const JobsFound: React.FC<{f: number; cursor?: boolean}> = ({f, cursor = true}) => {
  const cx = interpolate(f, [20, 56], [520, 742], {...clamp, easing: enter});
  const cy = interpolate(f, [20, 56], [520, 96], {...clamp, easing: enter});
  return (
    <div style={{position: 'relative'}}>
      <Window title="Jobs" app>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '18px 28px', borderBottom: `1px solid ${C.line}`}}>
          <Chip tone="done" size={22}>Found · 3</Chip><Chip tone="plain" size={22}>Ranked</Chip>
          <div style={{flex: 1}} />
          <Btn primary press={f > 58 && f < 64 ? 1 : 0}>Rank new</Btn>
        </div>
        {FOUND.map(([role, co, fit], i) => (
          <div key={role} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px',
            borderBottom: `1px solid ${C.line}`, opacity: prog(f, i * 4, 12)}}>
            <div>
              <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 29, color: C.paper}}>{role}</div>
              <div style={{fontFamily: F.body, fontSize: 23, color: C.haze, marginTop: 4}}>{co} · sample</div>
            </div>
            <Chip tone={fit === 'high' ? 'good' : 'plain'} size={21}>Preliminary fit · {fit}</Chip>
          </div>
        ))}
      </Window>
      {cursor && <Cursor x={cx} y={cy} press={f > 58 && f < 64} />}
    </div>
  );
};

const TheReturn: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M, right: M, top: 230, opacity: prog(f, 0, 10)}}><JobsFound f={f} /></div>
      <TextBlock top={720}>
        <Words text="Coming back felt harder than leaving." start={6} size={60} />
        <Note p={prog(f, 30, 12)}>Experience · 2013 – 2024 · career break 2024 – 26</Note>
      </TextBlock>
      <Grain opacity={0.06} />
    </AbsoluteFill>
  );
};

/* 5 · The sticky note on her monitor bezel: yellow wipes into the film's first coral */
const StickyNote: React.FC = () => {
  const f = useCurrentFrame();
  const lift = interpolate(f, [30, 54], [0, 1], {...clamp, easing: enter});
  const wipe = interpolate(f, [50, 70], [0, 1], {...clamp, easing: enter});
  return (
    <AbsoluteFill style={{opacity: prog(f, 0, 8)}}>
      <DeskBackdrop />
      <Monitor top={160}>
        <div style={{transform: 'scale(0.86)', transformOrigin: '50% 0', marginBottom: -70}}><JobsFound f={80} cursor={false} /></div>
      </Monitor>
      <div style={{position: 'absolute', left: 640, top: 470, width: 330, height: 290, borderRadius: 6,
        transform: `translate(${lift * 30}px, ${-lift * 60}px) rotate(${4 - lift * 9}deg)`, boxShadow: `0 ${16 + lift * 30}px 50px rgba(0,0,0,.5)`,
        background: YELLOW, overflow: 'hidden'}}>
        <div style={{position: 'absolute', inset: 0, background: C.flare, clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`}} />
        <div style={{position: 'relative', padding: '46px 34px', fontFamily: F.serif, fontStyle: 'italic', fontSize: 52, lineHeight: 1.08, color: '#2A1F10'}}>
          Lead with what you can do.
        </div>
      </div>
      <Scrim from={720} />
      <TextBlock top={810}>
        <Words text="So I took my own advice." start={6} size={62} />
      </TextBlock>
    </AbsoluteFill>
  );
};

/* 6 · Ranked: score, why it fits, the gap that was real */
const StillAFit: React.FC = () => {
  const f = useCurrentFrame();
  const intro = prog(f, 0, 14);
  const pulse = 1 + 0.07 * Math.sin(interpolate(f, [62, 78], [0, Math.PI], clamp));
  const out = interpolate(f, [124, 135], [0, 1], {...clamp, easing: exitEase});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M, right: M, top: 210, opacity: intro * (1 - out), transform: `translateY(${(1 - intro) * 30}px)`}}>
        <Window title="Jobs · Ranked" topBorder={C.flare} app>
          <RankedJob role={ROLE} company={CO} score={84} f={f} start={6}
            fits={['Full-cycle hiring', 'Stakeholder management', 'Hiring-manager coaching']} gaps={[]}
            gapSlot={<span style={{display: 'inline-block', transform: `scale(${pulse})`}}><Chip tone="gap" p={prog(f, 40, 12)}>Recent AI sourcing tools</Chip></span>} />
        </Window>
      </div>
      <TextBlock top={800}>
        <Words text="My skills hadn't expired." start={10} size={60} />
        <Feel text="One gap was real. I worked on it." start={66} />
      </TextBlock>
    </AbsoluteFill>
  );
};

/* 7 · Her story, in her words, saved only after she allows it */
const TYPED = 'Career break · 2024–26 · Family care; people-analytics certificate.';
const HerStory: React.FC = () => {
  const f = useCurrentFrame();
  const chars = Math.floor(interpolate(f, [8, 58], [0, TYPED.length], clamp));
  const showGate = prog(f, 62, 10);
  const allowed = interpolate(f, [94, 100], [0, 1], clamp);
  const line = (w: string) => <div style={{height: 13, width: w, borderRadius: 7, background: '#D9DBEA', margin: '12px 0'}} />;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M, right: M, top: 190, opacity: prog(f, 0, 10), transform: 'scale(0.9)', transformOrigin: '50% 0'}}>
        <Window title={`Studio · CV draft · ${ROLE}`} topBorder="linear-gradient(90deg,#2EE6FF,#7B61FF 55%,#FF4FB8)" app>
          <div style={{background: '#F4F5FF', margin: 22, borderRadius: 12, padding: '26px 32px', color: '#14162A'}}>
            <div style={{fontFamily: F.display, fontWeight: 800, fontSize: 36}}>Priya Raman</div>
            <div style={{fontFamily: F.body, fontSize: 22, color: '#4B4F6E', marginTop: 2}}>Senior Technical Recruiter · Talent acquisition</div>
            <div style={{fontFamily: F.mono, fontSize: 17, color: '#6B6F8E', marginTop: 18, letterSpacing: '0.06em'}}>EXPERIENCE</div>
            <div style={{fontFamily: F.body, fontSize: 24, lineHeight: 1.35, padding: '8px 12px', margin: '8px -12px', borderRadius: 8,
              background: `rgba(123,97,255,${0.18 * (1 - allowed)})`, minHeight: 66}}>
              {TYPED.slice(0, chars)}
              {chars < TYPED.length && <span style={{display: 'inline-block', width: 3, height: 26, background: '#14162A', verticalAlign: 'middle', marginLeft: 2}} />}
            </div>
            {line('92%')}{line('78%')}
          </div>
          <div style={{padding: '0 22px 22px', opacity: showGate, transform: `translateY(${(1 - showGate) * 16}px)`}}>
            <ApprovalCard tool="Write" target="applications/meridian/cv.tex" chosen={allowed} press={f > 90 && f < 95 ? 1 : 0} />
          </div>
        </Window>
      </div>
      <TextBlock top={872}>
        <Words text="The break is one line." start={64} size={52} />
        <Feel text="It isn't the headline." start={96} size={46} />
      </TextBlock>
    </AbsoluteFill>
  );
};

/* 8 · Practice the hard question, then she submits on the employer's site and moves the card herself */
const Prep: React.FC = () => {
  const f = useCurrentFrame();
  const a = 1 - interpolate(f, [62, 72], [0, 1], clamp);
  const b = prog(f, 66, 12);
  const mv = interpolate(f, [86, 110], [0, 1], {...clamp, easing: enter});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M, right: M, top: 220, opacity: prog(f, 0, 10) * a}}>
        <Window title="Interview · Mock interview" app>
          <div style={{padding: '24px 28px 30px'}}>
            <Label>Interviewer asks</Label>
            <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 34, color: C.paper, lineHeight: 1.25}}>
              <Words text="Tell me about the gap on your CV." start={6} size={34} font={F.body} weight={600} stagger={1} />
            </div>
            <Label>Tough questions</Label>
            {['Why come back now?', 'What changed in recruiting while you were away?'].map((q, k) => (
              <div key={q} style={{fontFamily: F.body, fontSize: 25, color: C.haze, padding: '6px 0', opacity: prog(f, 20 + k * 6, 10)}}>· {q}</div>
            ))}
          </div>
        </Window>
      </div>
      <div style={{position: 'absolute', left: M, right: M, top: 260, opacity: b}}>
        <Window title="Pipeline" app>
          <PipelineBoard cards={[{title: 'Fernhill · Recruiting Mgr', col: 0}]}
            moving={{title: 'Meridian · Talent Partner', from: 0, to: 1, t: mv}} />
          <div style={{padding: '0 28px 22px', fontFamily: F.body, fontSize: 22, color: C.haze}}>You submit on the employer's site. Then you move the card.</div>
        </Window>
      </div>
      <TextBlock top={800}>
        <Words text="Prepared. Clear." start={8} size={60} />
        <Feel text="And every application sent by me." start={74} size={50} />
      </TextBlock>
    </AbsoluteFill>
  );
};

/* 9 · I'm back: she turns the auto-reply off (her email, not the app) */
const ImBack: React.FC = () => {
  const f = useCurrentFrame();
  const on = interpolate(f, [12, 18], [1, 0], {...clamp, easing: enter});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M, right: M, top: 330, opacity: prog(f, 0, 10)}}>
        <Window title="Mail · Automatic replies"><Toggle on={on} label="Automatic replies" sub={on > 0.5 ? "I'm on a career break. Back in 2026." : 'Off'} /></Window>
      </div>
      <TextBlock top={640}>
        <Feel text="I'm back." start={30} size={130} color={C.paper} />
      </TextBlock>
    </AbsoluteFill>
  );
};

/* 10 · Pause → Ascend + end card */
const PauseToAscend: React.FC = () => {
  const f = useCurrentFrame();
  const m = interpolate(f, [10, 34], [0, 1], {...clamp, easing: enter});
  const s = 150;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M + 25, top: 170, opacity: 1 - m, transform: `rotate(${m * 45}deg) scale(${1 - m * 0.3})`}}>
        <PauseIcon size={s} opacity={1} />
      </div>
      <div style={{position: 'absolute', left: M, top: 160, transform: `scale(${0.6 + m * 0.4})`, transformOrigin: '0 0'}}>
        <AscendMark size={170} draw={m} id="ag2" />
      </div>
      <EndCard line="A pause isn't a full stop." start={30} />
    </AbsoluteFill>
  );
};

export const FILM2_SCENES = {advice: Advice, took: TookOne, months: Months, ret: TheReturn, note: StickyNote, fit: StillAFit, story: HerStory, prep: Prep, back: ImBack, end: PauseToAscend};

export const Film2: React.FC<FilmProps> = (p) => <FilmShell compId="Film2" scenes={FILM2_SCENES} {...p} />;
export const Film2Short: React.FC<FilmProps> = (p) => <FilmShell compId="Film2Short" scenes={FILM2_SCENES} {...p} />;
