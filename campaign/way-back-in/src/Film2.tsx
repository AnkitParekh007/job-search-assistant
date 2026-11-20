import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import cues from './film2-vo.json';
import visemes from './film2-visemes.json';
import {AVATARS} from './Avatar';
import {AURORA, C, F, Grain, LiveSlot, M, Tag, Words, clamp, enter, exitEase, prog} from './theme';
import {AscendMark, Captions, Chip, CornerAvatar, Cue, Cursor, EndCard, Feel, FitRow, Label, TextBlock, Toggle, Window, makeDuck} from './shared';

/* Film 2 · Return Date · Priya Raman · 35 s */

export const FILM2_FRAMES = 1050;
const S = {advice: 0, took: 105, months: 150, ret: 225, note: 330, fit: 420, story: 540, room: 660, back: 810, end: 930};
const CUES = cues as Cue[];
const duck = makeDuck(CUES);
const YELLOW = '#F2D16B';

type Props = {showSlates: boolean; withMusic: boolean; withVO: boolean; captions: boolean; avatar: boolean};

export const Film2: React.FC<Props> = ({showSlates, withMusic, withVO, captions, avatar}) => (
  <AbsoluteFill style={{background: C.ink}}>
    <Sequence from={S.advice} durationInFrames={105}><Advice /></Sequence>
    <Sequence from={S.took} durationInFrames={45}><TookOne /></Sequence>
    <Sequence from={S.months} durationInFrames={75}><Months show={showSlates} /></Sequence>
    <Sequence from={S.ret} durationInFrames={105}><TheReturn /></Sequence>
    <Sequence from={S.note} durationInFrames={90}><StickyNote show={showSlates} /></Sequence>
    <Sequence from={S.fit} durationInFrames={120}><StillAFit /></Sequence>
    <Sequence from={S.story} durationInFrames={120}><HerStory /></Sequence>
    <Sequence from={S.room} durationInFrames={150}><BackInTheRoom /></Sequence>
    <Sequence from={S.back} durationInFrames={120}><ImBack /></Sequence>
    <Sequence from={S.end} durationInFrames={120}><PauseToAscend /></Sequence>
    {withMusic && <Audio src={staticFile('film2-score.wav')} volume={(f) => (withVO ? duck(f / 30) : 1)} />}
    {withVO && <Audio src={staticFile('film2-vo.wav')} />}
    {captions && <Captions cues={CUES} />}
    {avatar && <CornerAvatar style={AVATARS.priya} visemes={visemes as [number, number, number][]} fadeOutAt={S.end + 20} />}
  </AbsoluteFill>
);

const PauseIcon: React.FC<{size: number; opacity: number}> = ({size, opacity}) => (
  <div style={{display: 'flex', gap: size * 0.22, opacity}}>
    {[0, 1].map((i) => <div key={i} style={{width: size * 0.26, height: size, borderRadius: size * 0.08, background: C.paper}} />)}
  </div>
);

/* 1 · Her own advice (0:00–0:03.5) */
const Advice: React.FC = () => (
  <AbsoluteFill>
    <Tag>Dramatization</Tag>
    <div style={{position: 'absolute', right: M + 20, top: 440}}><PauseIcon size={150} opacity={0.08} /></div>
    <TextBlock top={720}>
      <Words text="For 11 years, I told candidates a career break isn't a red flag." start={4} stagger={3} size={66}
        wordStyle={(w, i) => (i >= 11 ? {fontFamily: F.serif, fontStyle: 'italic', fontWeight: 400, color: C.haze} : undefined)} />
    </TextBlock>
    <Grain />
  </AbsoluteFill>
);

/* 2 · Then I took one (0:03.5–0:05) */
const TookOne: React.FC = () => {
  const f = useCurrentFrame();
  const on = interpolate(f, [8, 14], [0, 1], {...clamp, easing: enter});
  const fade = interpolate(f, [37, 45], [1, 0], clamp);
  return (
    <AbsoluteFill style={{opacity: fade}}>
      <div style={{position: 'absolute', left: M, right: M, top: 330, opacity: prog(f, 0, 8)}}>
        <Window title="Mail · Automatic replies"><Toggle on={on} label="Automatic replies" sub="I'm on sabbatical. Back in 2026." /></Window>
      </div>
      <TextBlock top={820}>
        <Words text="Then I took one." start={14} size={72} weight={800} />
        <div style={{fontFamily: F.mono, fontSize: 30, color: C.haze, opacity: prog(f, 20, 10)}}>Auto-reply: On sabbatical</div>
      </TextBlock>
      <Grain />
    </AbsoluteFill>
  );
};

/* 3 · 18 months (0:05–0:07.5): the break was good, so it stays warm */
const Months: React.FC<{show: boolean}> = ({show}) => {
  const f = useCurrentFrame();
  const shots = ['Reading to her father at his kitchen table', 'Her hands at an evening ceramics class', 'A train window, late light'];
  const i = Math.min(2, Math.floor(f / 25));
  const fadeIn = interpolate(f, [0, 8], [0, 1], clamp);
  return (
    <AbsoluteFill style={{opacity: fadeIn}}>
      <LiveSlot mood={i === 1 ? 'after' : 'warm'} label={`Handheld · ${shots[i]}`} show={show}>
        <TextBlock top={860}>
          <Words text="18 months." start={4} size={72} weight={800} />
          <Feel text="No regrets." start={18} size={64} color={C.paper} />
        </TextBlock>
      </LiveSlot>
    </AbsoluteFill>
  );
};

/* 4 · The return (0:07.5–0:11) */
const POSTS = ['Talent Partner · AI-assisted sourcing', 'Senior Recruiter · AI-assisted sourcing', 'Recruiting Lead · Hybrid'];
const TheReturn: React.FC = () => {
  const f = useCurrentFrame();
  const push = interpolate(f, [0, 105], [1, 1.04]);
  const cx = interpolate(f, [10, 50], [700, 724], {...clamp, easing: enter});
  const cy = interpolate(f, [10, 50], [640, 418], {...clamp, easing: enter});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M, right: M, top: 290, transform: `scale(${push})`, transformOrigin: '75% 30%'}}>
        <Window title="Jobs feed">
          {POSTS.map((p, i) => (
            <div key={p} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px',
              borderBottom: `1px solid ${C.line}`, opacity: prog(f, i * 4, 12)}}>
              <div>
                <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 28, color: C.paper}}>{p.split(' · ')[0]}</div>
                <div style={{fontFamily: F.body, fontSize: 22, color: C.haze, marginTop: 4}}>{p.split(' · ')[1]}</div>
              </div>
              <span style={{fontFamily: F.body, fontWeight: 600, fontSize: 22, color: C.paper, border: `1px solid ${C.line}`, padding: '10px 20px', borderRadius: 10}}>Apply</span>
            </div>
          ))}
        </Window>
        <Cursor x={cx} y={cy} />
      </div>
      <TextBlock top={840}>
        <Words text="Coming back felt harder than leaving." start={8} size={60} />
        <div style={{fontFamily: F.mono, fontSize: 30, color: C.haze, opacity: prog(f, 30, 12)}}>
          Experience · 2013 — <span style={{borderBottom: `3px solid ${C.haze}`}}>2024</span>
        </div>
      </TextBlock>
      <Grain />
    </AbsoluteFill>
  );
};

/* 5 · The sticky note (0:11–0:14): yellow wipes into the film's first coral */
const StickyNote: React.FC<{show: boolean}> = ({show}) => {
  const f = useCurrentFrame();
  const lift = interpolate(f, [18, 40], [0, 1], {...clamp, easing: enter});
  const wipe = interpolate(f, [40, 60], [0, 1], {...clamp, easing: enter});
  return (
    <LiveSlot mood="overcast" label="Macro · she peels the note off the monitor bezel" show={show}>
      <div style={{position: 'absolute', left: 300, top: 330, width: 460, height: 400, borderRadius: 6,
        transform: `translateY(${-lift * 50}px) rotate(${-3 + lift * 7}deg)`, boxShadow: `0 ${20 + lift * 30}px 60px rgba(0,0,0,.45)`,
        background: YELLOW, overflow: 'hidden', opacity: prog(f, 0, 10)}}>
        <div style={{position: 'absolute', inset: 0, background: C.flare, clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`}} />
        <div style={{position: 'relative', padding: '64px 44px', fontFamily: F.serif, fontStyle: 'italic', fontSize: 64, lineHeight: 1.1, color: '#2A1F10'}}>
          Lead with what you can do.
        </div>
      </div>
      <TextBlock top={860}>
        <Words text="So I took my own advice." start={6} size={60} />
        <Feel text="“Lead with what you can do.”" start={36} />
      </TextBlock>
    </LiveSlot>
  );
};

/* 6 · Still a fit (0:14–0:18) */
const StillAFit: React.FC = () => {
  const f = useCurrentFrame();
  const intro = prog(f, 0, 14);
  const pulse = 1 + 0.08 * Math.sin(interpolate(f, [56, 70], [0, Math.PI], clamp));
  const closed = interpolate(f, [82, 92], [0, 1], {...clamp, easing: enter});
  const out = interpolate(f, [110, 120], [0, 1], {...clamp, easing: exitEase});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M, right: M, top: 290, opacity: intro * (1 - out), transform: `translateY(${(1 - intro) * 30}px) scale(${1 + out * 0.6})`, transformOrigin: '30% 80%'}}>
        <Window title="Jobs · Ranked" topBorder={C.flare}>
          <FitRow role="Senior Talent Partner" fit={86} f={f} start={6} />
          <div style={{padding: '0 28px 28px'}}>
            <Label>WHY IT FITS</Label>
            <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
              {['Full-cycle hiring', 'Stakeholder management', 'Hiring-manager coaching'].map((s, k) => <Chip key={s} tone="good" p={prog(f, 20 + k * 2, 12)}>{s}</Chip>)}
            </div>
            <Label>GAPS TO ADDRESS</Label>
            <div style={{position: 'relative', display: 'inline-block', transform: `scale(${pulse})`}}>
              {closed < 0.5
                ? <Chip tone="gap" p={prog(f, 40, 12)}>Recent AI sourcing tools</Chip>
                : <Chip tone="done" p={1}>
                    <svg width="22" height="18" viewBox="0 0 22 18" style={{marginRight: 8, verticalAlign: '-2px'}}>
                      <path d="M2 9 L8 15 L20 3" fill="none" stroke={C.cyan} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - closed} />
                    </svg>
                    AI sourcing course · complete
                  </Chip>}
            </div>
          </div>
        </Window>
      </div>
      <TextBlock top={880}>
        <Words text="My skills hadn't expired." start={8} size={60} />
        <Feel text="One gap was real. I closed it." start={60} />
      </TextBlock>
    </AbsoluteFill>
  );
};

/* 7 · Her story (0:18–0:22) */
const TYPED = 'Sabbatical · 2024–25 · Family care; certificate in people analytics.';
const HerStory: React.FC = () => {
  const f = useCurrentFrame();
  const chars = Math.floor(interpolate(f, [12, 70], [0, TYPED.length], clamp));
  const approved = f >= 88;
  const press = f >= 86 && f < 88 ? 0.97 : 1;
  const glow = interpolate(f, [88, 104], [0, 1], clamp);
  const line = (w: string) => <div style={{height: 14, width: w, borderRadius: 7, background: '#D9DBEA', margin: '14px 0'}} />;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M, right: M, top: 290, opacity: prog(f, 0, 10), transform: 'scale(0.75)', transformOrigin: '50% 0%'}}>
        <Window title="Studio · Tailored CV · Senior Talent Partner" topBorder={AURORA}>
          <div style={{background: '#F4F5FF', margin: 26, borderRadius: 12, padding: '34px 38px', color: '#14162A',
            boxShadow: `0 0 0 ${glow * 4}px rgba(123,97,255,${glow * 0.9}), 0 0 ${glow * 50}px rgba(46,230,255,${glow * 0.35})`}}>
            <div style={{fontFamily: F.display, fontWeight: 800, fontSize: 40}}>Priya Raman</div>
            <div style={{fontFamily: F.body, fontSize: 24, color: '#4B4F6E', marginTop: 4}}>Senior Technical Recruiter · Talent acquisition</div>
            <div style={{fontFamily: F.mono, fontSize: 18, color: '#6B6F8E', marginTop: 28, letterSpacing: '0.06em'}}>EXPERIENCE</div>
            <div style={{fontFamily: F.body, fontSize: 25, lineHeight: 1.4, padding: '10px 12px', margin: '10px -12px', borderRadius: 8,
              background: `rgba(123,97,255,${approved ? 0 : 0.18})`, minHeight: 72}}>
              {TYPED.slice(0, chars)}
              {chars < TYPED.length && <span style={{display: 'inline-block', width: 3, height: 28, background: '#14162A', verticalAlign: 'middle', marginLeft: 2}} />}
            </div>
            {line('92%')}{line('80%')}{line('86%')}{line('60%')}
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
        <Words text="The break is one line." start={6} size={60} />
        <Feel text="It isn't the headline." start={50} />
      </TextBlock>
    </AbsoluteFill>
  );
};

/* 8 · Back in the room (0:22–0:27) */
const BackInTheRoom: React.FC = () => {
  const f = useCurrentFrame();
  const speaker = Math.floor(f / 20) % 2; // shot-reverse-shot on the beat
  const tiles = [{who: 'PR', name: 'You', warm: true}, {who: 'MK', name: 'Hiring manager', warm: false}, {who: 'JA', name: 'Director', warm: false}];
  const move = interpolate(f, [80, 100], [0, 1], {...clamp, easing: enter});
  const colW = 450;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M, right: M, top: 290, display: 'flex', gap: 14, opacity: prog(f, 0, 10)}}>
        {tiles.map((t, i) => {
          const live = (i === 0 && speaker === 0) || (i === 1 && speaker === 1);
          return (
            <div key={t.who} style={{flex: 1, height: 230, borderRadius: 18, position: 'relative', overflow: 'hidden',
              background: t.warm ? 'radial-gradient(90% 90% at 70% 20%, #5A3B2C, #1E1420)' : 'radial-gradient(90% 90% at 30% 20%, #2B3150, #12142A)',
              border: `3px solid ${live ? C.flare : C.line}`}}>
              <div style={{position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%,-50%)', width: 92, height: 92, borderRadius: 46,
                background: 'rgba(255,255,255,.12)', display: 'grid', placeItems: 'center', fontFamily: F.body, fontWeight: 600, fontSize: 34, color: C.paper}}>{t.who}</div>
              <div style={{position: 'absolute', left: 14, bottom: 12, fontFamily: F.body, fontSize: 20, color: C.paper}}>{t.name}</div>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: M, right: M, top: 560, display: 'flex', gap: 14, opacity: prog(f, 20, 12)}}>
        {['Interviewing', 'Final round'].map((c, i) => (
          <div key={c} style={{width: colW, height: 230, borderRadius: 16, background: C.surface, border: `1px solid ${C.line}`, padding: 16}}>
            <div style={{fontFamily: F.mono, fontSize: 20, color: i === 1 ? C.flare : C.haze}}>{c}</div>
          </div>
        ))}
        {['Senior Talent Partner', 'Talent Lead'].map((t, i) => (
          <div key={t} style={{position: 'absolute', left: 16 + move * (colW + 14), top: 52 + i * 84, width: colW - 32, height: 70, borderRadius: 12,
            background: C.surface2, border: `1px solid ${i === 0 ? C.flare : C.line}`, padding: '12px 16px', boxSizing: 'border-box'}}>
            <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 22, color: C.paper}}>{t}</div>
            <div style={{height: 5, borderRadius: 3, marginTop: 10, width: '60%', background: i === 0 ? AURORA : C.line}} />
          </div>
        ))}
      </div>
      <TextBlock top={860}>
        <Words text="Prepared. Clear." start={6} size={64} />
        <Feel text="Back in the room." start={40} />
      </TextBlock>
    </AbsoluteFill>
  );
};

/* 9 · I'm back (0:27–0:31): the scene 2 toggle, mirrored */
const ImBack: React.FC = () => {
  const f = useCurrentFrame();
  const on = interpolate(f, [8, 14], [1, 0], {...clamp, easing: enter});
  const sig = 'Priya Raman · Senior Talent Partner';
  const chars = Math.floor(interpolate(f, [18, 46], [0, sig.length], clamp));
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M, right: M, top: 330, opacity: prog(f, 0, 8)}}>
        <Window title="Mail · Automatic replies">
          <Toggle on={on} label="Automatic replies" sub={on > 0.5 ? "I'm on sabbatical. Back in 2026." : 'Off'} />
          <div style={{borderTop: `1px solid ${C.line}`, padding: '24px 32px 30px'}}>
            <div style={{fontFamily: F.mono, fontSize: 20, color: C.haze, letterSpacing: '0.06em'}}>SIGNATURE</div>
            <div style={{fontFamily: F.body, fontSize: 30, color: C.paper, marginTop: 12, minHeight: 40}}>{sig.slice(0, chars)}</div>
          </div>
        </Window>
      </div>
      <TextBlock top={800}>
        <Feel text="I'm back." start={44} size={110} color={C.paper} />
        <div style={{fontFamily: F.mono, fontSize: 32, color: C.haze, opacity: prog(f, 58, 12)}}>Senior Talent Partner</div>
      </TextBlock>
    </AbsoluteFill>
  );
};

/* 10 · Pause → Ascend + end card (0:31–0:35) */
const PauseToAscend: React.FC = () => {
  const f = useCurrentFrame();
  const rise = interpolate(f, [10, 34], [0, 1], {...clamp, easing: enter});
  const swap = interpolate(f, [30, 40], [0, 1], clamp);
  const s = 150;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M + 25, top: 230, opacity: 1 - swap}}>
        <div style={{position: 'absolute', left: 0, top: rise * 120, width: s * 0.26, height: s * (1 - rise * 0.9), borderRadius: 12, background: C.paper, opacity: 1 - rise * 0.6}} />
        <div style={{position: 'absolute', left: s * 0.48, top: -rise * 30, width: s * 0.26, height: s, borderRadius: 12, background: rise > 0.4 ? C.flare : C.paper,
          transform: `rotate(${rise * 45}deg)`, transformOrigin: '50% 100%'}} />
      </div>
      <div style={{position: 'absolute', left: M, top: 190, opacity: swap}}>
        <AscendMark size={200} draw={interpolate(f, [30, 54], [0, 1], {...clamp, easing: enter})} id="ag2" />
      </div>
      <EndCard line="A pause isn't a full stop." cta="Plan your return · Free for Mac & Windows" start={52} />
    </AbsoluteFill>
  );
};
