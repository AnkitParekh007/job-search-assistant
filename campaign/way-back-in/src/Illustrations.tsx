import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {C, F, clamp, enter} from './theme';

/*
  Original illustrated scenes, drawn in code for this campaign (no stock, no generated footage,
  no third-party art). They replace the old LIVE-ACTION SLOT placeholders. Each fills the frame;
  scene type sits on the scrim at the bottom.
*/

const W = 1080, H = 1350;

// Dark gradient behind scene type so it reads over any illustration.
export const Scrim: React.FC<{from?: number}> = ({from = 640}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: from, bottom: 0,
    background: `linear-gradient(180deg, rgba(7,8,20,0) 0%, rgba(7,8,20,.82) 30%, ${C.ink} 70%)`}} />
);

const Vignette: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(95% 75% at 50% 40%, transparent 45%, rgba(0,0,0,.55) 100%)'}} />
);

/* ---------- Film 1 · morning kitchen table, laptop opens ---------- */
export const KitchenMorning: React.FC = () => {
  const f = useCurrentFrame();
  const open = interpolate(f, [8, 40], [0.04, 1], {...clamp, easing: enter});
  const glow = interpolate(f, [24, 60], [0, 1], clamp);
  const drift = interpolate(f, [0, 120], [0, -14]);
  return (
    <AbsoluteFill style={{background: '#151827', overflow: 'hidden'}}>
      <svg width={W} height={H} style={{position: 'absolute', transform: `translateX(${drift}px) scale(1.03)`}}>
        <defs>
          <linearGradient id="kw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2A2F48" /><stop offset="1" stopColor="#171A2B" /></linearGradient>
          <linearGradient id="kwin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#DCE3F6" /><stop offset="1" stopColor="#8E9BC4" /></linearGradient>
          <linearGradient id="ktab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4A372E" /><stop offset="1" stopColor="#21181A" /></linearGradient>
          <linearGradient id="kshaft" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E6ECFF" stopOpacity=".22" /><stop offset="1" stopColor="#E6ECFF" stopOpacity="0" /></linearGradient>
          <linearGradient id="kscr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8C97D6" /><stop offset="1" stopColor="#4B5490" /></linearGradient>
        </defs>
        <rect width={W} height={H} fill="url(#kw)" />
        {/* window */}
        <rect x="70" y="150" width="380" height="430" rx="10" fill="url(#kwin)" opacity=".9" />
        <path d="M260 150 V580 M70 365 H450" stroke="#2A2F48" strokeWidth="14" />
        <rect x="70" y="150" width="380" height="430" rx="10" fill="none" stroke="#2A2F48" strokeWidth="18" />
        <path d="M110 260 Q160 230 210 262 M300 200 Q350 175 400 205" stroke="#FFFFFF" strokeOpacity=".35" strokeWidth="6" fill="none" strokeLinecap="round" />
        {/* plant on the sill */}
        <rect x="360" y="545" width="64" height="58" rx="8" fill="#B5654A" />
        {[[-30, -70], [-6, -92], [18, -76], [34, -50], [-40, -40]].map(([dx, dy], i) => (
          <ellipse key={i} cx={392 + dx * 0.6} cy={548 + dy * 0.6} rx="16" ry="34" fill={i % 2 ? '#3E7A5A' : '#4F9470'}
            transform={`rotate(${dx} ${392 + dx * 0.6} ${548 + dy * 0.6})`} />
        ))}
        {/* light shaft across the room */}
        <polygon points="450,170 450,580 1080,1000 1080,560" fill="url(#kshaft)" />
        {/* table */}
        <polygon points="0,700 1080,660 1080,1350 0,1350" fill="url(#ktab)" />
        <polygon points="0,700 1080,660 1080,672 0,712" fill="#6A5144" />
        {/* mug + steam */}
        <g transform="translate(160 640)">
          <ellipse cx="60" cy="118" rx="70" ry="14" fill="#000" opacity=".35" />
          <path d="M0 10 H120 V100 Q120 122 98 122 H22 Q0 122 0 100 Z" fill="#E7E2D8" />
          <ellipse cx="60" cy="10" rx="60" ry="12" fill="#CFC8BA" />
          <ellipse cx="60" cy="12" rx="50" ry="8" fill="#5A3A28" />
          <path d="M120 34 Q160 34 158 62 Q156 88 120 86" fill="none" stroke="#E7E2D8" strokeWidth="14" />
          {[0, 1, 2].map((i) => {
            const ph = f / 14 + i * 2.1;
            const o = 0.18 + 0.12 * Math.sin(ph);
            return <path key={i} d={`M${40 + i * 20} -6 C ${30 + i * 20 + 14 * Math.sin(ph)} -40, ${54 + i * 20 - 14 * Math.sin(ph)} -70, ${40 + i * 20} -110`}
              fill="none" stroke="#FFFFFF" strokeOpacity={o} strokeWidth="7" strokeLinecap="round" />;
          })}
        </g>
        {/* laptop */}
        <g transform="translate(400 470)">
          <ellipse cx="290" cy="300" rx="330" ry="30" fill="#000" opacity=".35" />
          <polygon points="0,290 580,290 540,250 40,250" fill="#9DA3BF" />
          <polygon points="0,290 580,290 576,300 4,300" fill="#6D7393" />
          <g transform={`translate(290 250) scale(1 ${open}) translate(-290 -250)`}>
            <rect x="46" y="-58" width="488" height="308" rx="14" fill="#2B2F45" />
            <rect x="60" y="-44" width="460" height="280" rx="6" fill="url(#kscr)" opacity={0.25 + glow * 0.75} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <rect key={i} x="88" y={-14 + i * 34} width={[300, 220, 360, 180, 280, 240][i]} height="12" rx="6" fill="#FFFFFF" opacity={glow * 0.35} />
            ))}
          </g>
        </g>
      </svg>
      <Vignette />
      <Scrim from={700} />
    </AbsoluteFill>
  );
};

/* ---------- Film 1 · window at night, phone glow, rack focus ---------- */
export const NightWindow: React.FC = () => {
  const f = useCurrentFrame();
  const focus = interpolate(f, [10, 50], [0, 1], {...clamp, easing: enter});
  return (
    <AbsoluteFill style={{background: '#05060E', overflow: 'hidden'}}>
      {/* city through the glass */}
      <div style={{position: 'absolute', left: 120, top: 150, width: 840, height: 640, overflow: 'hidden', borderRadius: 8,
        background: 'linear-gradient(180deg, #0B1028 0%, #141B3A 70%, #1E1730 100%)'}}>
        <div style={{position: 'absolute', inset: 0, filter: `blur(${2 + focus * 7}px)`}}>
          {new Array(34).fill(0).map((_, i) => {
            const x = random(`nx${i}`) * 840, y = 120 + random(`ny${i}`) * 300, r = 14 + random(`nr${i}`) * 34;
            const warm = random(`nh${i}`) > 0.65;
            return <div key={i} style={{position: 'absolute', left: x, top: y, width: r, height: r, borderRadius: '50%',
              background: warm ? '#FFB37A' : '#8FB0FF', opacity: 0.55 + 0.25 * Math.sin(f / 16 + i)}} />;
          })}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={`b${i}`} style={{position: 'absolute', left: i * 128 - 20, bottom: 0, width: 110, height: 140 + random(`bh${i}`) * 260,
              background: '#070A1C', opacity: 0.9}} />
          ))}
        </div>
        {/* rain */}
        <svg width="840" height="640" style={{position: 'absolute', inset: 0}}>
          {new Array(40).fill(0).map((_, i) => {
            const x = random(`rx${i}`) * 840;
            const y = ((random(`ry${i}`) * 640 + f * (9 + random(`rs${i}`) * 6)) % 700) - 60;
            return <line key={i} x1={x} y1={y} x2={x - 4} y2={y + 34} stroke="#9FB3FF" strokeOpacity=".22" strokeWidth="2" />;
          })}
        </svg>
      </div>
      {/* frame */}
      <div style={{position: 'absolute', left: 120, top: 150, width: 840, height: 640, border: '22px solid #10132A', borderRadius: 8, boxSizing: 'border-box'}} />
      <div style={{position: 'absolute', left: 529, top: 150, width: 22, height: 640, background: '#10132A'}} />
      {/* sill */}
      <div style={{position: 'absolute', left: 80, top: 780, width: 920, height: 40, borderRadius: 6, background: 'linear-gradient(180deg,#1C2040,#0C0E20)'}} />
      {/* phone glow on the sill */}
      <div style={{position: 'absolute', left: 620, top: 700, width: 360, height: 200, borderRadius: '50%',
        background: 'radial-gradient(closest-side, rgba(140,170,255,.32), transparent)', filter: `blur(${(1 - focus) * 2}px)`}} />
      <div style={{position: 'absolute', left: 720, top: 770, width: 150, height: 22, borderRadius: 6, transform: 'skewX(-30deg)',
        background: '#AFC2FF', boxShadow: '0 0 40px rgba(150,180,255,.8)', filter: `blur(${(1 - focus) * 4}px)`}} />
      <Vignette />
      <Scrim from={760} />
    </AbsoluteFill>
  );
};

/* ---------- Film 2 · eighteen months, three warm vignettes ---------- */
export const MonthsMontage: React.FC = () => {
  const f = useCurrentFrame();
  const i = Math.min(2, Math.floor(f / 25));
  const local = f - i * 25;
  const xf = interpolate(local, [0, 5], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: '#1A1215', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, opacity: i === 0 ? 1 : 1 - xf * 0}}>{i === 0 && <TeaTable f={f} />}</div>
      {i === 1 && <div style={{position: 'absolute', inset: 0, opacity: xf}}><Wheel f={f} /></div>}
      {i === 2 && <div style={{position: 'absolute', inset: 0, opacity: xf}}><TrainWindow f={f} /></div>}
      <Vignette />
      <Scrim from={700} />
    </AbsoluteFill>
  );
};

const TeaTable: React.FC<{f: number}> = ({f}) => (
  <svg width={W} height={H}>
    <defs>
      <radialGradient id="lamp" cx="0.7" cy="0.15" r="0.8"><stop offset="0" stopColor="#F4B97A" /><stop offset=".45" stopColor="#6A3E2C" /><stop offset="1" stopColor="#1A1215" /></radialGradient>
    </defs>
    <rect width={W} height={H} fill="url(#lamp)" />
    <polygon points="0,640 1080,600 1080,1350 0,1350" fill="#3B2620" />
    <polygon points="0,640 1080,600 1080,612 0,652" fill="#7A5240" />
    {/* open book */}
    <g transform={`translate(330 ${560 - Math.sin(f / 20) * 2})`}>
      <path d="M0 40 Q110 0 210 30 L210 170 Q110 140 0 180 Z" fill="#F2E8D5" />
      <path d="M210 30 Q310 0 420 40 L420 180 Q310 140 210 170 Z" fill="#E9DDC6" />
      {[0, 1, 2, 3, 4].map((k) => <path key={k} d={`M30 ${70 + k * 18} Q110 ${45 + k * 18} 185 ${62 + k * 18}`} stroke="#B8A88C" strokeWidth="5" fill="none" />)}
      {[0, 1, 2, 3, 4].map((k) => <path key={`r${k}`} d={`M235 ${62 + k * 18} Q310 ${45 + k * 18} 395 ${70 + k * 18}`} stroke="#B8A88C" strokeWidth="5" fill="none" />)}
    </g>
    {/* two cups */}
    {[[170, 600], [800, 590]].map(([x, y], k) => (
      <g key={k} transform={`translate(${x} ${y})`}>
        <ellipse cx="50" cy="96" rx="64" ry="12" fill="#000" opacity=".3" />
        <path d="M0 10 H100 V70 Q100 98 70 98 H30 Q0 98 0 70 Z" fill={k ? '#C9D8C5' : '#E9C9B0'} />
        <ellipse cx="50" cy="10" rx="50" ry="10" fill="#7A4A2A" />
        <path d="M100 26 Q132 30 128 52 Q124 72 98 70" fill="none" stroke={k ? '#C9D8C5' : '#E9C9B0'} strokeWidth="10" />
      </g>
    ))}
    {/* reading glasses */}
    <g transform="translate(620 760)" fill="none" stroke="#D9C9A8" strokeWidth="6">
      <circle cx="0" cy="0" r="34" /><circle cx="92" cy="0" r="34" /><path d="M34 0 Q46 -10 58 0 M-34 0 L-80 -14 M126 0 L170 -14" />
    </g>
  </svg>
);

const Wheel: React.FC<{f: number}> = ({f}) => {
  const a = f * 14;
  return (
    <svg width={W} height={H}>
      <defs>
        <radialGradient id="studio" cx="0.3" cy="0.1" r="0.9"><stop offset="0" stopColor="#E8A877" /><stop offset=".5" stopColor="#5A3528" /><stop offset="1" stopColor="#1A1215" /></radialGradient>
        <linearGradient id="clay" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8A4F36" /><stop offset=".45" stopColor="#D08C64" /><stop offset="1" stopColor="#7A432E" /></linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#studio)" />
      <ellipse cx="540" cy="700" rx="360" ry="90" fill="#2A1C1A" />
      <ellipse cx="540" cy="690" rx="340" ry="80" fill="#4A3A36" />
      {[0, 1, 2, 3, 4, 5].map((k) => {
        const ang = ((a + k * 60) % 360) * Math.PI / 180;
        return <ellipse key={k} cx={540 + Math.cos(ang) * 260} cy={690 + Math.sin(ang) * 60} rx="18" ry="6" fill="#6A5650" opacity={0.4 + 0.4 * Math.sin(ang)} />;
      })}
      {/* bowl */}
      <path d="M380 520 Q380 680 540 690 Q700 680 700 520 Z" fill="url(#clay)" />
      <ellipse cx="540" cy="520" rx="160" ry="34" fill="#B97552" />
      <ellipse cx="540" cy="524" rx="136" ry="24" fill="#6A3A28" />
      {[0, 1, 2].map((k) => {
        const y = 560 + k * 38;
        const off = ((f * 6 + k * 40) % 120) - 60;
        return <path key={k} d={`M${400 + k * 8} ${y} Q540 ${y + 22} ${680 - k * 8} ${y}`} stroke="#F0B48C" strokeOpacity={0.25 + 0.1 * Math.sin(off / 10)} strokeWidth="4" fill="none" />;
      })}
    </svg>
  );
};

const TrainWindow: React.FC<{f: number}> = ({f}) => {
  const t = f - 50;
  const layer = (speed: number, color: string, base: number, amp: number, seed: string) => {
    const off = -((t * speed) % 540);
    const pts = new Array(14).fill(0).map((_, k) => `${off + k * 120},${base - amp * (0.5 + 0.5 * Math.sin(k * 1.7 + random(seed + k) * 3))}`);
    return <polygon points={`${off},${H} ${pts.join(' ')} ${off + 13 * 120},${H}`} fill={color} />;
  };
  return (
    <svg width={W} height={H}>
      <defs>
        <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3B2B4A" /><stop offset=".55" stopColor="#E89A6A" /><stop offset="1" stopColor="#F3C08A" /></linearGradient>
        <clipPath id="pane"><rect x="140" y="170" width="800" height="600" rx="70" /></clipPath>
      </defs>
      <rect width={W} height={H} fill="#24161B" />
      <g clipPath="url(#pane)">
        <rect x="140" y="170" width="800" height="600" fill="url(#dusk)" />
        <circle cx="700" cy="560" r="70" fill="#FFE2B0" opacity=".85" />
        {layer(3, '#9C5E58', 640, 120, 'a')}
        {layer(7, '#6A3B44', 700, 90, 'b')}
        {layer(16, '#3A2230', 760, 60, 'c')}
      </g>
      <rect x="140" y="170" width="800" height="600" rx="70" fill="none" stroke="#3A2A30" strokeWidth="34" />
      <rect x="100" y="800" width="880" height="34" rx="10" fill="#3A2A30" />
    </svg>
  );
};

/* ---------- Film 2 · monitor with the sticky note on its bezel (app on screen) ---------- */
export const Monitor: React.FC<{children: React.ReactNode; top?: number}> = ({children, top = 250}) => (
  <div style={{position: 'absolute', left: 60, right: 60, top}}>
    <div style={{background: '#0E1020', borderRadius: 26, padding: 22, boxShadow: '0 50px 120px rgba(0,0,0,.6)', border: '1px solid #23284A'}}>
      <div style={{borderRadius: 10, overflow: 'hidden', background: C.ink}}>{children}</div>
    </div>
    <div style={{width: 160, height: 60, margin: '0 auto', background: 'linear-gradient(180deg,#14172C,#0A0C18)'}} />
    <div style={{width: 360, height: 16, margin: '0 auto', borderRadius: 8, background: '#14172C'}} />
  </div>
);

export const DeskBackdrop: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(120% 80% at 85% 10%, #3A4058 0%, #1A1D2E 45%, #070814 100%)'}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 790, bottom: 0, background: 'linear-gradient(180deg,#2A2230,#120E16)'}} />
    <Vignette />
  </AbsoluteFill>
);

/* ---------- Film 3 · dark monitor, reports building themselves, his reflection ---------- */
export const AutoReports: React.FC = () => {
  const f = useCurrentFrame();
  const bars = [0.42, 0.6, 0.38, 0.75, 0.55, 0.82, 0.66, 0.9];
  return (
    <AbsoluteFill style={{background: '#04050C', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 90, right: 90, top: 210, height: 560, borderRadius: 20, background: '#0B0E1E', border: '1px solid #1C2140', overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 36, top: 26, fontFamily: F.mono, fontSize: 22, color: '#5C6290'}}>weekly_report · auto-refresh 06:00</div>
        <svg width="900" height="520" style={{position: 'absolute', left: 0, top: 40}}>
          {bars.map((b, k) => {
            const g = interpolate(f, [6 + k * 5, 26 + k * 5], [0, 1], {...clamp, easing: enter});
            return <rect key={k} x={50 + k * 102} y={440 - b * 300 * g} width="62" height={b * 300 * g} rx="8" fill={k === bars.length - 1 ? '#3A4AA8' : '#22295A'} />;
          })}
          <path d={`M50 ${300} ${bars.map((b, k) => `L${81 + k * 102} ${420 - b * 290}`).join(' ')}`} fill="none" stroke="#4A5BC8" strokeWidth="4"
            strokeDasharray="1400" strokeDashoffset={1400 * (1 - interpolate(f, [30, 70], [0, 1], clamp))} />
        </svg>
        {/* reflection: a figure in the dark glass */}
        <svg width="900" height="560" style={{position: 'absolute', inset: 0, opacity: 0.22}}>
          <ellipse cx="610" cy="250" rx="92" ry="112" fill="#8E96C8" />
          <path d="M440 560 Q470 380 610 372 Q750 380 780 560 Z" fill="#8E96C8" />
        </svg>
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(255,255,255,.07), transparent 40%)'}} />
      </div>
      <Vignette />
      <Scrim from={760} />
    </AbsoluteFill>
  );
};
