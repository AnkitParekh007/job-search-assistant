import {Composition} from 'remotion';
import {Film1, FILM1_FRAMES} from './Film1';
import {Lineup} from './Lineup';
import {Film2, FILM2_FRAMES} from './Film2';
import {Film3, FILM3_FRAMES} from './Film3';

export const Root: React.FC = () => (
  <>
  <Composition id="AvatarLineup" component={Lineup} durationInFrames={1200} fps={30} width={1620} height={620} />
  <Composition
    id="Film1"
    component={Film1}
    durationInFrames={FILM1_FRAMES}
    fps={30}
    width={1080}
    height={1350}
    defaultProps={{company: 'Anthropic', showSlates: true, withMusic: true, withVO: true, captions: true, avatar: true}}
  />
  <Composition id="Film2" component={Film2} durationInFrames={FILM2_FRAMES} fps={30} width={1080} height={1350}
    defaultProps={{showSlates: true, withMusic: true, withVO: true, captions: true, avatar: true}} />
  <Composition id="Film3" component={Film3} durationInFrames={FILM3_FRAMES} fps={30} width={1080} height={1350}
    defaultProps={{showSlates: true, withMusic: true, withVO: true, captions: true, avatar: true}} />
  </>
);
