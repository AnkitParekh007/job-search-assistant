import {AbsoluteFill} from 'remotion';
import {AVATARS, AvatarBubble} from './Avatar';
import {C, F} from './theme';
import {VISEMES} from './generated';

export const Lineup: React.FC = () => (
  <AbsoluteFill style={{background: C.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around'}}>
    {(['daniel', 'priya', 'tomas'] as const).map((k) => (
      <div key={k} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20}}>
        <AvatarBubble style={AVATARS[k]} visemes={VISEMES['film1-commit-history']} size={460} />
        <span style={{fontFamily: F.mono, fontSize: 28, color: C.haze}}>{AVATARS[k].name}</span>
      </div>
    ))}
  </AbsoluteFill>
);
