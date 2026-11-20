import React from 'react';
import {Composition, Still} from 'remotion';
import {Film1, Film1Short} from './Film1';
import {Film2, Film2Short} from './Film2';
import {Film3, Film3Short} from './Film3';
import {Cover} from './Cover';
import {Lineup} from './Lineup';
import {FilmProps, layout} from './shared';

const defaults: FilmProps = {music: true, voice: true, captions: true, avatar: true};
const film = (id: Parameters<typeof layout>[0], component: React.FC<FilmProps>) => (
  <Composition key={id} id={id} component={component} durationInFrames={layout(id).frames} fps={30} width={1080} height={1350} defaultProps={defaults} />
);

export const Root: React.FC = () => (
  <>
    {film('Film2', Film2)}
    {film('Film1', Film1)}
    {film('Film3', Film3)}
    {film('Film2Short', Film2Short)}
    {film('Film1Short', Film1Short)}
    {film('Film3Short', Film3Short)}
    <Still id="Cover1" component={Cover} width={1080} height={1350} defaultProps={{who: 'daniel' as const}} />
    <Still id="Cover2" component={Cover} width={1080} height={1350} defaultProps={{who: 'priya' as const}} />
    <Still id="Cover3" component={Cover} width={1080} height={1350} defaultProps={{who: 'tomas' as const}} />
    <Composition id="AvatarLineup" component={Lineup} durationInFrames={300} fps={30} width={1620} height={620} />
  </>
);
