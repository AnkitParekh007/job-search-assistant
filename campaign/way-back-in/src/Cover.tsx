import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AVATARS, AvatarBubble} from './Avatar';
import {AURORA, C, F, M} from './theme';
import {AscendMark, CLAIMS, ModeTag} from './shared';

/* Still covers (4:5) for each film: hook line, presenter, product name. No outcome claims. */

const COPY = {
  daniel: {hook: ['14 months.', '0 commits.'], line: 'Run your comeback like a project.'},
  priya: {hook: ['A pause', "isn't a full stop."], line: 'Coming back after a career break.'},
  tomas: {hook: ['142 applications.', '0 replies.'], line: 'So he checked what a parser could read.'},
};

export const Cover: React.FC<{who: keyof typeof COPY}> = ({who}) => {
  const c = COPY[who];
  return (
    <AbsoluteFill style={{background: C.ink}}>
      <AbsoluteFill style={{background: 'radial-gradient(80% 60% at 85% 10%, rgba(123,97,255,.28), transparent 60%)'}} />
      <ModeTag kind="story" label="Dramatization · fictional character" still />
      <div style={{position: 'absolute', right: 70, top: 150}}>
        <AvatarBubble style={AVATARS[who]} visemes={[[0, 0, 0]]} size={380} />
      </div>
      <div style={{position: 'absolute', left: M, right: M, top: 600}}>
        {c.hook.map((h, i) => (
          <div key={h} style={{fontFamily: F.display, fontWeight: 800, fontSize: 108, lineHeight: 1.02, letterSpacing: '-0.02em',
            color: i === 1 ? C.flare : C.paper}}>{h}</div>
        ))}
        <div style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 56, color: C.haze, marginTop: 24}}>{c.line}</div>
      </div>
      <div style={{position: 'absolute', left: M, right: M, bottom: 210, display: 'flex', alignItems: 'center', gap: 20}}>
        <AscendMark size={84} draw={1} id={`cv-${who}`} />
        <div>
          <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 36, color: C.paper}}>AI Job Search Assistant</div>
          <div style={{fontFamily: F.mono, fontSize: 24, color: C.haze, marginTop: 4}}>{CLAIMS.url}</div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 8, background: AURORA}} />
    </AbsoluteFill>
  );
};
