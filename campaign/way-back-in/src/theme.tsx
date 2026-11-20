import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {loadFont as loadDisplay} from '@remotion/google-fonts/BricolageGrotesque';
import {loadFont as loadBody} from '@remotion/google-fonts/Figtree';
import {loadFont as loadSerif} from '@remotion/google-fonts/InstrumentSerif';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';

// Google Fonts, all SIL Open Font License 1.1 (see LICENSES.md).
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

// Safe areas for 4:5 feeds on phones: 90 px side margins, nothing in the bottom 200 px.
// Captions own the band just above it; scene type must end above CAPTION_TOP.
export const M = 90;
export const SAFE_BOTTOM = 1350 - 200;
export const CAPTION_TOP = 1010;

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
