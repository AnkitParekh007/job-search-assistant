import {AbsoluteFill, Easing, interpolate, useCurrentFrame, random} from 'remotion';
import {loadFont as loadDisplay} from '@remotion/google-fonts/BricolageGrotesque';
import {loadFont as loadBody} from '@remotion/google-fonts/Figtree';
import {loadFont as loadSerif} from '@remotion/google-fonts/InstrumentSerif';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';

// Google Fonts stand-ins for Cabinet Grotesk / Satoshi (same as the campaign page).
export const F = {
  display: loadDisplay('normal', {weights: ['600', '800'], subsets: ['latin']}).fontFamily,
  body: loadBody('normal', {weights: ['400', '500', '600'], subsets: ['latin']}).fontFamily,
  serif: loadSerif('italic', {weights: ['400'], subsets: ['latin']}).fontFamily,
  mono: loadMono('normal', {weights: ['400', '500'], subsets: ['latin']}).fontFamily,
};

export const C = {
  ink: '#070814',
  surface: '#13162C',
  surface2: '#1A1E3A',
  line: '#262B4D',
  paper: '#F4F5FF',
  haze: '#A6ABCC',
  dim: '#6C7196',
  flare: '#FF8C66',
  cyan: '#2EE6FF',
  violet: '#7B61FF',
  magenta: '#FF4FB8',
  cellEmpty: '#1B1F3C',
  cellFaint: '#2A2E4D',
};
export const AURORA = `linear-gradient(90deg, ${C.cyan}, ${C.violet} 55%, ${C.magenta})`;

export const enter = Easing.bezier(0.2, 0, 0, 1);
export const exitEase = Easing.in(Easing.cubic);

// 90 px side margins; type never in the bottom 200 px.
export const M = 90;
export const SAFE_BOTTOM = 1350 - 200;

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const prog = (frame: number, start: number, dur = 15) =>
  interpolate(frame, [start, start + dur], [0, 1], {...clamp, easing: enter});

type WordsProps = {
  text: string;
  start: number;
  size?: number;
  font?: string;
  weight?: number;
  color?: string;
  italic?: boolean;
  stagger?: number;
  style?: React.CSSProperties;
  wordStyle?: (word: string, i: number) => React.CSSProperties | undefined;
};

// Words enter in ~70 ms steps, rising 24 px with a blur that clears.
export const Words: React.FC<WordsProps> = ({
  text, start, size = 64, font = F.display, weight = 600, color = C.paper,
  italic, stagger = 2, style, wordStyle,
}) => {
  const frame = useCurrentFrame();
  const words = text.split(' ');
  return (
    <div style={{fontFamily: font, fontSize: size, fontWeight: weight, color, lineHeight: 1.08,
      letterSpacing: font === F.display ? '-0.02em' : 0, fontStyle: italic ? 'italic' : 'normal', ...style}}>
      {words.map((w, i) => {
        const p = prog(frame, start + i * stagger, 15);
        return (
          <span key={i} style={{display: 'inline-block', marginRight: '0.24em', opacity: p,
            transform: `translateY(${(1 - p) * 24}px)`, filter: `blur(${(1 - p) * 8}px)`, ...wordStyle?.(w, i)}}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

// Light 16 mm-style grain for the struggle act.
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.09}) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 50;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'overlay', opacity}}>
      <svg width="1080" height="1350">
        <filter id={`g${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1080" height="1350" filter={`url(#g${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

export const Tag: React.FC<{children: React.ReactNode; opacity?: number}> = ({children, opacity = 1}) => (
  <div style={{position: 'absolute', top: 64, left: M, fontFamily: F.mono, fontSize: 24, color: C.haze,
    letterSpacing: '0.08em', textTransform: 'uppercase', opacity,
    border: `1px solid ${C.line}`, padding: '6px 12px', borderRadius: 6}}>
    {children}
  </div>
);

// Stand-in for a live-action shot: mood lighting, vignette and a slate label.
export const LiveSlot: React.FC<{
  mood: 'overcast' | 'night' | 'warm' | 'after';
  label: string;
  show: boolean;
  children?: React.ReactNode;
}> = ({mood, label, show, children}) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 150], [1, 1.03]);
  const bg = {
    overcast: `radial-gradient(120% 80% at 85% 15%, #3A4058 0%, #1A1D2E 45%, ${C.ink} 100%)`,
    night: `radial-gradient(60% 40% at 50% 62%, #1C2440 0%, #0B0D1C 55%, #04050C 100%)`,
    warm: `radial-gradient(110% 80% at 80% 10%, #5A3B2C 0%, #24171A 50%, ${C.ink} 100%)`,
    after: `radial-gradient(110% 80% at 75% 15%, #6A4632 0%, #2A1B1C 50%, ${C.ink} 100%)`,
  }[mood];
  return (
    <AbsoluteFill style={{background: C.ink, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: bg, transform: `scale(${drift})`}} />
      {mood === 'night' && <CityBokeh />}
      <AbsoluteFill style={{background: 'radial-gradient(90% 70% at 50% 45%, transparent 40%, rgba(0,0,0,.55) 100%)'}} />
      {show && (
        <div style={{position: 'absolute', top: 64, left: M, fontFamily: F.mono, fontSize: 20, color: C.dim,
          letterSpacing: '0.06em', lineHeight: 1.5, maxWidth: 560}}>
          LIVE-ACTION SLOT<br />{label}
        </div>
      )}
      {children}
    </AbsoluteFill>
  );
};

const CityBokeh: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {new Array(26).fill(0).map((_, i) => {
        const x = random(`x${i}`) * 1080;
        const y = 120 + random(`y${i}`) * 520;
        const r = 10 + random(`r${i}`) * 34;
        const hue = random(`h${i}`) > 0.7 ? '#FFB37A' : '#7FA4FF';
        const tw = 0.25 + 0.2 * Math.sin(frame / 18 + i);
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: r, height: r, borderRadius: '50%',
          background: hue, opacity: tw, filter: 'blur(6px)'}} />;
      })}
    </AbsoluteFill>
  );
};
