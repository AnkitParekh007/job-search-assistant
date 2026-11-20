import {AbsoluteFill, Audio, Sequence, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import cues from './film3-vo.json';
import visemes from './film3-visemes.json';
import {AVATARS} from './Avatar';
import {AURORA, C, F, Grain, LiveSlot, M, Tag, Words, clamp, enter, exitEase, prog} from './theme';
import {AscendMark, Captions, Chip, CornerAvatar, Cue, EndCard, Feel, FitRow, Label, TextBlock, Window, makeDuck} from './shared';

/* Film 3 · Parsed · Tomás Herrera · 30 s */

export const FILM3_FRAMES = 900;
const S = {kpi: 0, cons: 60, parse: 180, bad: 300, clean: 390, day3: 540, offer: 660, end: 780};
const CUES = cues as Cue[];
const duck = makeDuck(CUES);

type Props = {showSlates: boolean; withMusic: boolean; withVO: boolean; captions: boolean; avatar: boolean};

export const Film3: React.FC<Props> = ({showSlates, withMusic, withVO, captions, avatar}) => (
  <AbsoluteFill style={{background: C.ink}}>
    <Sequence from={S.kpi} durationInFrames={60}><Kpis /></Sequence>
    <Sequence from={S.cons} durationInFrames={120}><Consolidated show={showSlates} /></Sequence>
    <Sequence from={S.parse} durationInFrames={120}><ParserView /></Sequence>
    <Sequence from={S.bad} durationInFrames={90}><BadData show={showSlates} /></Sequence>
    <Sequence from={S.clean} durationInFrames={150}><CleanSignal /></Sequence>
    <Sequence from={S.day3} durationInFrames={120}><Day3 /></Sequence>
    <Sequence from={S.offer} durationInFrames={120}><Offer show={showSlates} /></Sequence>
    <Sequence from={S.end} durationInFrames={120}><ChartToAscend /></Sequence>
    {withMusic && <Audio src={staticFile('film3-score.wav')} volume={(f) => (withVO ? duck(f / 30) : 1)} />}
    {withVO && <Audio src={staticFile('film3-vo.wav')} />}
    {captions && <Captions cues={CUES} />}
    {avatar && <CornerAvatar style={AVATARS.tomas} visemes={visemes as [number, number, number][]} fadeOutAt={S.end + 24} />}
  </AbsoluteFill>
);

/* ---------- the dashboard (scene 1 and the end) ---------- */

const Tile: React.FC<{label: string; value: string; accent?: boolean}> = ({label, value, accent}) => (
  <div style={{flex: 1, background: C.ink, border: `1px solid ${C.line}`, borderRadius: 14, padding: '18px 20px'}}>
    <div style={{fontFamily: F.mono, fontSize: 18, color: C.haze, letterSpacing: '0.04em'}}>{label}</div>
    <div style={{fontFamily: F.mono, fontSize: 52, fontWeight: 500, color: accent ? C.flare : C.paper, marginTop: 8, fontVariantNumeric: 'tabular-nums'}}>{value}</div>
  </div>
);

const Dashboard: React.FC<{apps: number; replies: number; rate: string; draw: number; up: number}> = ({apps, replies, rate, draw, up}) => {
  // 12 weekly points; flat at zero, or climbing once replies come in
  const pts = new Array(12).fill(0).map((_, i) => {
    const x = 20 + (i / 11) * 820;
    const climb = up * Math.pow(i / 11, 2.2) * 190;
    return [x, 230 - climb] as const;
  });
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  return (
    <Window title="Job search · Dashboard">
      <div style={{padding: 24}}>
        <div style={{display: 'flex', gap: 14}}>
          <Tile label="APPLICATIONS" value={String(apps)} />
          <Tile label="REPLIES" value={String(replies)} accent={replies > 0} />
          <Tile label="RESPONSE RATE" value={rate} />
        </div>
        <svg width="860" height="250" style={{marginTop: 18, display: 'block'}}>
          {[50, 110, 170, 230].map((y) => <line key={y} x1="20" x2="840" y1={y} y2={y} stroke={C.line} strokeWidth="1" />)}
          <path d={d} fill="none" stroke={up > 0 ? 'url(#lg3)' : C.haze} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
            pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
          <defs><linearGradient id="lg3" x1="0" x2="1"><stop offset="0" stopColor={C.cyan} /><stop offset=".55" stopColor={C.violet} /><stop offset="1" stopColor={C.magenta} /></linearGradient></defs>
        </svg>
      </div>
    </Window>
  );
};

/* 1 · His own KPIs (0:00–0:02) */
const Kpis: React.FC = () => {
  const f = useCurrentFrame();
  const apps = f < 10 ? 141 : 142;
  const draw = interpolate(f, [14, 29], [0, 1], {...clamp, easing: enter});
  return (
    <AbsoluteFill>
      <Tag>Dramatization</Tag>
      <div style={{position: 'absolute', left: M, right: M, top: 290}}>
        <Dashboard apps={apps} replies={0} rate="0.0%" draw={draw} up={0} />
      </div>
      <TextBlock top={880}>
        <Words text="Applications 142 · Replies 0" start={8} size={64} weight={800} />
      </TextBlock>
      <Grain />
    </AbsoluteFill>
  );
};

/* 2 · Consolidated (0:02–0:06) */
const Consolidated: React.FC<{show: boolean}> = ({show}) => {
  const f = useCurrentFrame();
  const toast = interpolate(f, [4, 20], [0, 1], {...clamp, easing: enter});
  const msg = prog(f, 36, 16);
  const dark = interpolate(f, [92, 112], [0, 0.75], clamp);
  return (
    <LiveSlot mood="night" label="Flashback · his reflection in the dark monitor" show={show}>
      <div style={{position: 'absolute', left: M, width: 640, top: 300 - (1 - toast) * 40, opacity: toast,
        background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, padding: '20px 24px', boxShadow: '0 20px 60px rgba(0,0,0,.5)'}}>
        <div style={{fontFamily: F.mono, fontSize: 20, color: C.haze}}>CALENDAR</div>
        <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 30, color: C.paper, marginTop: 6}}>Org update · 15 min</div>
        <div style={{fontFamily: F.body, fontSize: 24, color: C.haze, marginTop: 4}}>Friday 4:30</div>
      </div>
      <div style={{position: 'absolute', left: M, width: 760, top: 470, opacity: msg, transform: `translateY(${(1 - msg) * 20}px)`,
        background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 18, padding: '22px 26px'}}>
        <div style={{fontFamily: F.mono, fontSize: 20, color: C.haze}}>MESSAGE</div>
        <div style={{fontFamily: F.body, fontSize: 30, color: C.paper, marginTop: 8, lineHeight: 1.3}}>
          Your role is being consolidated into our automated reporting platform.
        </div>
      </div>
      <AbsoluteFill style={{background: '#000', opacity: dark}} />
      <TextBlock top={860}>
        <Words text="The reports I built now build themselves." start={10} size={60} />
      </TextBlock>
      <Grain />
    </LiveSlot>
  );
};

/* 3 · What the parser sees (0:06–0:10): the film's one effect */
const SCRAMBLE = ['PARSED: SQLPythonTabl?au Le d anlytics …', 'Exp?rience 2019 Retail Analyst2021–2023 Dem', '? ? ? Skills Leadersh ip Forecast?ng 2023', 'Ed ucation BSc Stat?stics Retail Op erations'];

const Glyphs: React.FC<{text: string; amount: number; seed: string; size?: number; color?: string}> = ({text, amount, seed, size = 26, color = C.haze}) => {
  const f = useCurrentFrame();
  return (
    <div style={{fontFamily: F.mono, fontSize: size, color, whiteSpace: 'pre', lineHeight: 1.6}}>
      {text.split('').map((ch, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const r = (random(`${seed}r${i}`) * 16 + 4) * amount;
        const drift = Math.sin(f / 12 + i) * 2 * amount;
        return <span key={i} style={{display: 'inline-block', transform: `translate(${Math.cos(a) * r + drift}px, ${Math.sin(a) * r}px)`,
          opacity: 1 - amount * 0.25 * random(`${seed}o${i}`)}}>{ch === ' ' ? ' ' : ch}</span>;
      })}
    </div>
  );
};

const ParserView: React.FC = () => {
  const f = useCurrentFrame();
  const slide = interpolate(f, [16, 34], [0, 1], {...clamp, easing: enter});
  const shear = interpolate(f, [36, 70], [0, 1], {...clamp, easing: enter});
  const bar = (w: string) => <div style={{height: 12, borderRadius: 6, background: '#C9CCDD', width: w, margin: '12px 0'}} />;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M, right: M, top: 290, height: 500, borderRadius: 16, background: '#F4F5FF', display: 'flex', overflow: 'hidden', opacity: prog(f, 0, 10)}}>
        <div style={{width: 260, background: '#2B3150', padding: 24}}>
          <div style={{width: 90, height: 90, borderRadius: 45, background: '#495078'}} />
          <div style={{fontFamily: F.display, fontWeight: 800, fontSize: 28, color: '#F4F5FF', marginTop: 18}}>Tomás Herrera</div>
          {['✉', '☎', '⌂'].map((ic) => <div key={ic} style={{fontSize: 22, color: '#C9CCDD', marginTop: 14}}>{ic} {'———'}</div>)}
        </div>
        <div style={{flex: 1, padding: 28}}>
          <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 26, color: '#14162A'}}>Data Analyst</div>
          {bar('90%')}{bar('70%')}{bar('84%')}{bar('62%')}{bar('88%')}{bar('54%')}
        </div>
      </div>
      <div style={{position: 'absolute', left: M + 60, right: M - 10, top: 330, height: 440, borderRadius: 16, background: C.surface,
        border: `1px solid ${C.line}`, padding: '20px 26px', transform: `translateX(${(1 - slide) * 1000}px)`, boxShadow: '0 30px 90px rgba(0,0,0,.6)'}}>
        <div style={{fontFamily: F.mono, fontSize: 20, color: C.haze, marginBottom: 14}}>WHAT THE SCREENING SOFTWARE READS</div>
        {SCRAMBLE.map((l, i) => <Glyphs key={i} text={l} amount={shear} seed={`p${i}`} size={i === 0 ? 27 : 24} color={i === 0 ? C.paper : C.haze} />)}
      </div>
      <TextBlock top={880}>
        <Words text="Turns out the first reader isn't human." start={20} size={60} />
      </TextBlock>
      <Grain />
    </AbsoluteFill>
  );
};

/* 4 · Bad data (0:10–0:13): first coral */
const BadData: React.FC<{show: boolean}> = ({show}) => {
  const f = useCurrentFrame();
  const u = interpolate(f, [44, 58], [0, 1], {...clamp, easing: enter});
  return (
    <LiveSlot mood="overcast" label="Close-up · he leans in, rolls his sleeves, a first half-smile" show={show}>
      <TextBlock top={760}>
        <Words text="Fine." start={2} size={110} weight={800} />
        <div style={{position: 'relative', alignSelf: 'flex-start'}}>
          <Words text="I know how to fix bad data." start={30} size={60} />
          <div style={{position: 'absolute', left: 0, bottom: -8, height: 6, borderRadius: 3, background: C.flare, width: `${u * 100}%`}} />
        </div>
      </TextBlock>
    </LiveSlot>
  );
};

/* 5 · Clean signal (0:13–0:18): the scatter runs in reverse into labelled fields */
const FIELDS: [string, string][] = [
  ['Name', 'Tomás Herrera'], ['Title', 'Data Analyst'], ['Skills', 'SQL · Python · Tableau · dbt'],
  ['Experience', 'Built a demand forecast that cut stockouts 18%.'], ['Dates', '2019 – 2025 · Retail analytics'],
];
const CleanSignal: React.FC = () => {
  const f = useCurrentFrame();
  const swap = f >= 56;
  const edge = interpolate(f, [110, 130], [0, 1], clamp);
  const out = interpolate(f, [140, 150], [0, 1], {...clamp, easing: exitEase});
  return (
    <AbsoluteFill>
      {!swap ? (
        <div style={{position: 'absolute', left: M, right: M, top: 290, opacity: prog(f, 0, 12)}}>
          <Window title="Jobs · Ranked" topBorder={C.flare}>
            <FitRow role="Analytics Engineer" fit={79} f={f} start={4} />
            <div style={{padding: '0 28px 28px'}}>
              <Label>GAPS TO ADDRESS</Label>
              <Chip tone="gap" p={prog(f, 26, 12)}>dbt in production</Chip>
            </div>
          </Window>
        </div>
      ) : (
        <div style={{position: 'absolute', left: M, right: M, top: 290, transform: `translateY(${out * 80}px)`, opacity: 1 - out}}>
          <Window title="Studio · ATS check" topBorder={AURORA}
            style={{boxShadow: `0 0 0 ${edge * 3}px rgba(123,97,255,${edge * 0.8}), 0 0 ${edge * 60}px rgba(46,230,255,${edge * 0.3})`}}>
            <div style={{padding: '10px 0'}}>
              {FIELDS.map(([k, v], i) => {
                const lock = interpolate(f, [60 + i * 6, 90 + i * 6], [1, 0], {...clamp, easing: enter});
                return (
                  <div key={k} style={{display: 'flex', alignItems: 'baseline', gap: 18, padding: '12px 28px', borderBottom: `1px solid ${C.line}`}}>
                    <span style={{width: 160, fontFamily: F.mono, fontSize: 20, color: C.haze, flexShrink: 0}}>{k.toUpperCase()}</span>
                    <Glyphs text={v} amount={lock} seed={`c${i}`} size={24} color={C.paper} />
                    <span style={{marginLeft: 'auto', color: C.cyan, fontFamily: F.mono, fontSize: 22, opacity: lock < 0.05 ? 1 : 0}}>✓</span>
                  </div>
                );
              })}
            </div>
          </Window>
        </div>
      )}
      <TextBlock top={880}>
        <Words text="Same experience. Readable value." start={6} size={60} />
        <div style={{fontFamily: F.mono, fontSize: 30, color: C.haze, opacity: prog(f, 112, 10)}}>ATS check · parsed cleanly</div>
      </TextBlock>
    </AbsoluteFill>
  );
};

/* 6 · Day 3 (0:18–0:22) */
const Flap: React.FC<{text: string; flip: number}> = ({text, flip}) => (
  <div style={{fontFamily: F.mono, fontSize: 96, fontWeight: 500, color: C.paper, background: C.surface, border: `1px solid ${C.line}`,
    borderRadius: 14, padding: '10px 30px', transform: `scaleY(${Math.abs(Math.cos(flip * Math.PI))})`, fontVariantNumeric: 'tabular-nums'}}>{text}</div>
);
const Day3: React.FC = () => {
  const f = useCurrentFrame();
  const day = f < 22 ? 1 : f < 44 ? 2 : 3;
  const flip = f < 22 ? 0 : f < 44 ? interpolate(f, [22, 28], [0, 1], clamp) : interpolate(f, [44, 50], [0, 1], clamp);
  const phone = interpolate(f, [58, 72], [0, 1], {...clamp, easing: enter});
  const buzz = f > 72 && f < 86 ? Math.sin(f * 3) * 4 : 0;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M, top: 300, display: 'flex', alignItems: 'center', gap: 28}}>
        <Flap text={`DAY ${day}`} flip={flip} />
        <div style={{background: C.surface2, border: `1px solid ${C.flare}`, borderRadius: 12, padding: '14px 18px'}}>
          <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 24, color: C.paper}}>Analytics Engineer</div>
          <div style={{fontFamily: F.mono, fontSize: 18, color: C.haze, marginTop: 6}}>Applied · by you</div>
        </div>
      </div>
      <div style={{position: 'absolute', left: M, width: 700, top: 520 + (1 - phone) * 60, opacity: phone, transform: `translateX(${buzz}px)`,
        background: C.surface, border: `1px solid ${C.line}`, borderRadius: 22, padding: '22px 26px', boxShadow: '0 20px 60px rgba(0,0,0,.5)'}}>
        <div style={{fontFamily: F.mono, fontSize: 20, color: C.haze}}>RECRUITER · NOW</div>
        <div style={{fontFamily: F.body, fontSize: 32, color: C.paper, marginTop: 8}}>Hi Tomás, are you free to talk tomorrow?</div>
      </div>
      <TextBlock top={860}>
        <Words text="Day 3: first recruiter call." start={60} size={60} />
        <div style={{fontFamily: F.mono, fontSize: 30, color: C.haze, opacity: prog(f, 4, 12)}}>Day 1 · Day 2 · Day 3</div>
      </TextBlock>
    </AbsoluteFill>
  );
};

/* 7 · Offer (0:22–0:26) */
const Offer: React.FC<{show: boolean}> = ({show}) => {
  const f = useCurrentFrame();
  const cuts = ['Technical interview · whiteboard SQL', 'Panel call', 'Handshake at an office door'];
  if (f < 75) {
    const i = Math.floor(f / 25);
    return <LiveSlot mood={i === 2 ? 'after' : 'warm'} label={cuts[i]} show={show} />;
  }
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M, right: M, top: 330}}>
        <Window title="Inbox">
          <div style={{padding: '28px 30px'}}>
            <div style={{fontFamily: F.body, fontSize: 22, color: C.haze}}>Recruiting team</div>
            <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 34, color: C.paper, marginTop: 10}}>Offer · Analytics Engineer</div>
            {[94, 86, 70].map((w, i) => <div key={i} style={{height: 12, borderRadius: 6, background: C.line, width: `${w}%`, margin: '20px 0'}} />)}
          </div>
        </Window>
      </div>
      <TextBlock top={860}>
        <Words text="Analytics Engineer." start={78} size={64} />
        <Feel text="Week 3." start={92} />
      </TextBlock>
    </AbsoluteFill>
  );
};

/* 8 · Chart → Ascend + end card (0:26–0:30) */
const ChartToAscend: React.FC = () => {
  const f = useCurrentFrame();
  const replies = Math.round(interpolate(f, [4, 20], [0, 6], clamp));
  const up = interpolate(f, [18, 39], [0, 1], {...clamp, easing: enter});
  const morph = interpolate(f, [40, 62], [0, 1], {...clamp, easing: enter});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M, right: M, top: 290, opacity: 1 - morph, transform: `scale(${1 - morph * 0.4})`, transformOrigin: '90% 60%'}}>
        <Dashboard apps={142} replies={replies} rate={`${((replies / 142) * 100).toFixed(1)}%`} draw={1} up={up} />
      </div>
      <div style={{position: 'absolute', left: M, top: 190, opacity: morph}}>
        <AscendMark size={200} draw={morph} id="ag3" />
      </div>
      <EndCard line="AI changed the market. Not your value." cta="Make your experience readable · Free for Mac & Windows" start={62} />
    </AbsoluteFill>
  );
};
