import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {C, F, Grain, M, Words, clamp, enter, exitEase, prog} from './theme';
import {AscendMark, Btn, Chip, Cursor, EndCard, Feel, FilmProps, FilmShell, Note, RankedJob, TextBlock, Window} from './shared';
import {AutoReports} from './Illustrations';

/*
  Film 3 · Parsed · Tomás Herrera (fictional) · ~31 s
  Story: a BI analyst whose reporting job was automated sends 142 applications and hears nothing.
  Product (from 0:06): Studio's PDF view and its "ATS text check", which shows the text layer extracted
  from the PDF (packages/ui PdfView.tsx -> tools/verify_pdf.py). That is all the film claims about ATS:
  no parse score, no pass rate, no "ATS Intelligence" (planned, not shipped). Then Jobs ranking.
  Ending: no recruiter call, no offer, no chart going up.
*/

const ROLE = 'Analytics Engineer';
const CO = 'Harbor & Pine (sample)';

/* 1 · His own spreadsheet (story, fictional numbers) */
const Kpis: React.FC = () => {
  const f = useCurrentFrame();
  const n = Math.round(interpolate(f, [4, 30], [0, 142], {...clamp, easing: enter}));
  const cell = (v: React.ReactNode, w: number, head?: boolean, hot?: boolean) => (
    <div style={{width: w, padding: '14px 16px', borderRight: `1px solid ${C.line}`, fontFamily: head ? F.mono : F.body, fontSize: head ? 20 : 30,
      fontWeight: head ? 400 : 600, color: hot ? C.flare : head ? C.haze : C.paper}}>{v}</div>
  );
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M, right: M, top: 300, opacity: prog(f, 0, 8)}}>
        <Window title="my-search.xlsx">
          <div style={{display: 'flex', borderBottom: `1px solid ${C.line}`}}>{cell('APPLICATIONS', 300, true)}{cell('REPLIES', 250, true)}{cell('WEEKS', 250, true)}</div>
          <div style={{display: 'flex'}}>{cell(n, 300)}{cell(0, 250, false, true)}{cell(11, 250)}</div>
        </Window>
      </div>
      <TextBlock top={640}>
        <Words text="142 applications." start={6} size={88} weight={800} />
        <Words text="0 replies." start={26} size={88} weight={800} color={C.flare} />
      </TextBlock>
      <Grain />
    </AbsoluteFill>
  );
};

/* 2 · The reports he used to build now build themselves (original illustration) */
const Consolidated: React.FC = () => (
  <AbsoluteFill>
    <AutoReports />
    <TextBlock top={830}>
      <Words text="The reports I built" start={6} size={58} />
      <Feel text="now build themselves." start={30} size={54} />
    </TextBlock>
    <Grain opacity={0.08} />
  </AbsoluteFill>
);

/* ---------- Studio PDF view with the ATS text check (labels from PdfView.tsx) ---------- */
const PdfPane: React.FC<{twoCol: boolean}> = ({twoCol}) => {
  const bar = (w: string, c = '#C9CCDD') => <div style={{height: 9, borderRadius: 5, background: c, width: w, margin: '8px 0'}} />;
  return (
    <div style={{width: 300, height: 390, background: '#FFFFFF', borderRadius: 6, display: 'flex', overflow: 'hidden', flexShrink: 0, boxShadow: '0 10px 30px rgba(0,0,0,.4)'}}>
      {twoCol && (
        <div style={{width: 104, background: '#2B3150', padding: 14}}>
          <div style={{width: 46, height: 46, borderRadius: 23, background: '#495078'}} />
          {[0, 1, 2, 3].map((i) => <div key={i} style={{display: 'flex', gap: 6, alignItems: 'center', marginTop: 12}}><div style={{width: 12, height: 12, borderRadius: 3, background: '#9AA0C8'}} />{bar('50%', '#5A628F')}</div>)}
          <div style={{marginTop: 16}}>{bar('80%', '#5A628F')}{bar('60%', '#5A628F')}{bar('70%', '#5A628F')}</div>
        </div>
      )}
      <div style={{flex: 1, padding: 16}}>
        <div style={{fontFamily: F.display, fontWeight: 800, fontSize: twoCol ? 15 : 19, color: '#14162A'}}>Tomás Herrera</div>
        <div style={{fontFamily: F.body, fontSize: 11, color: '#4B4F6E'}}>{twoCol ? 'Data Analyst' : 'Analytics Engineer · SQL · dbt · BI'}</div>
        <div style={{fontFamily: F.mono, fontSize: 9, color: '#6B6F8E', marginTop: 12}}>EXPERIENCE</div>
        {bar('92%')}{bar('70%')}{bar('84%')}{bar('62%')}
        <div style={{fontFamily: F.mono, fontSize: 9, color: '#6B6F8E', marginTop: 10}}>{twoCol ? 'SKILLS' : 'EDUCATION'}</div>
        {bar('88%')}{bar('54%')}{bar('76%')}
      </div>
    </div>
  );
};

const MESSY = [
  'Tomás Herrera Data Analyst ',
  ' ——— EXPERIENCE 2019– Retail',
  'Analyst  ——— SQL Tableau 2021–',
  '2025 Senior BI Developer ',
  'Skills Leadersh ip Forecast',
];
const CLEAN = [
  'Tomás Herrera',
  'Analytics Engineer · SQL · dbt · BI',
  'EXPERIENCE',
  '2021–2025  Senior BI Developer, Coastline Retail',
  '2019–2021  Retail Analyst, Coastline Retail',
];

const TextCheck: React.FC<{clean: boolean}> = ({clean}) => {
  const f = useCurrentFrame();
  const press = f >= 34 && f < 40;
  const shown = prog(f, 42, 12);
  const cx = interpolate(f, [8, 32], [560, 820], {...clamp, easing: enter});
  const cy = interpolate(f, [8, 32], [420, 96], {...clamp, easing: enter});
  const lines = clean ? CLEAN : MESSY;
  return (
    <div style={{position: 'relative'}}>
      <Window title={clean ? 'Studio · cv-onecolumn.pdf' : 'Studio · cv-final-v4.pdf'} topBorder={clean ? C.cyan : C.flare} app>
        <div style={{display: 'flex', gap: 10, alignItems: 'center', padding: '14px 22px', borderBottom: `1px solid ${C.line}`}}>
          <span style={{fontFamily: F.mono, fontSize: 19, color: C.dim, flex: 1}}>applications/harbor/cv.pdf</span>
          <Btn>Compile</Btn>
          <Btn primary press={press ? 1 : 0}>ATS text check</Btn>
        </div>
        <div style={{display: 'flex', gap: 20, padding: 22}}>
          <PdfPane twoCol={!clean} />
          <div style={{flex: 1, minWidth: 0, opacity: shown}}>
            {clean && <div style={{fontFamily: F.mono, fontSize: 19, color: '#5BE3A0', marginBottom: 8}}>1 page(s)</div>}
            <div style={{fontFamily: F.mono, fontSize: 19, color: C.haze, marginBottom: 8}}>Extracted text</div>
            {lines.map((l, i) => {
              const jit = clean ? 0 : (random(`m${i}`) - 0.5) * 18 * shown;
              return <div key={i} style={{fontFamily: F.mono, fontSize: 22, lineHeight: 1.45, color: clean ? C.paper : i % 2 ? C.flare : C.haze,
                whiteSpace: 'pre-wrap', transform: `translateX(${jit}px)`, opacity: prog(f, 44 + i * 3, 8)}}>{l}</div>;
            })}
          </div>
        </div>
      </Window>
      <Cursor x={cx} y={cy} press={press} />
    </div>
  );
};

/* 3 · He checks the text layer of his résumé */
const Parse: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M - 20, right: M - 20, top: 210, opacity: prog(f, 0, 10)}}><TextCheck clean={false} /></div>
      <TextBlock top={810}>
        <Words text="So I checked what a parser could read." start={8} size={52} />
        <Feel text="Columns crossed. Icons became noise." start={70} size={46} />
      </TextBlock>
    </AbsoluteFill>
  );
};

/* 4 · Fine. I know how to fix bad data. */
const BadData: React.FC = () => {
  const f = useCurrentFrame();
  const snap = interpolate(f, [34, 58], [0, 1], {...clamp, easing: enter});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M, right: M, top: 260, height: 300}}>
        {new Array(18).fill(0).map((_, i) => {
          const col = i % 3, row = Math.floor(i / 3);
          const rx = random(`bx${i}`) * 760, ry = random(`by${i}`) * 260;
          const x = rx + (col * 300 - rx) * snap, y = ry + (row * 46 - ry) * snap;
          return <div key={i} style={{position: 'absolute', left: x, top: y, width: 260, height: 30, borderRadius: 6,
            background: snap > 0.9 ? (col === 0 ? 'rgba(46,230,255,.35)' : C.surface2) : 'rgba(255,140,102,.28)', opacity: prog(f, i, 8)}} />;
        })}
      </div>
      <TextBlock top={640}>
        <Words text="Fine." start={2} size={120} weight={800} color={C.flare} />
        <Words text="I know how to fix bad data." start={18} size={60} />
      </TextBlock>
      <Grain />
    </AbsoluteFill>
  );
};

/* 5 · One column, real text: the same check now reads in order */
const Clean: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M - 20, right: M - 20, top: 210, opacity: prog(f, 0, 10)}}><TextCheck clean /></div>
      <TextBlock top={810}>
        <Words text="Same experience." start={10} size={56} />
        <Feel text="Text that reads in order." start={70} size={50} />
      </TextBlock>
    </AbsoluteFill>
  );
};

/* 6 · Roles that fit; fewer applications, each one his */
const Fit: React.FC = () => {
  const f = useCurrentFrame();
  const out = interpolate(f, [124, 135], [0, 1], {...clamp, easing: exitEase});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M, right: M, top: 200, opacity: prog(f, 0, 12) * (1 - out)}}>
        <Window title="Jobs · Ranked" topBorder={C.flare} app>
          <RankedJob role={ROLE} company={CO} score={81} f={f} start={8}
            fits={['SQL + dbt', 'Stakeholder reporting', 'Data modeling']} gaps={['Python orchestration']} />
        </Window>
      </div>
      <TextBlock top={850}>
        <Words text="Roles that fit." start={10} size={56} />
        <Feel text="Fewer applications. Each one mine." start={60} size={48} />
      </TextBlock>
    </AbsoluteFill>
  );
};

/* 7 · The straight answer about ATS */
const Honest: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <TextBlock top={330}>
        <Words text="No tool can promise what every screening system does." start={4} size={64} weight={800} stagger={2} />
        <div style={{height: 20}} />
        <Feel text="But I can check what mine reads." start={56} size={58} color={C.paper} />
        <div style={{height: 26}} />
        <Note p={prog(f, 80, 12)}>The ATS text check reads your PDF's text layer locally. It needs poppler installed.</Note>
      </TextBlock>
      <Grain />
    </AbsoluteFill>
  );
};

/* 8 · The flat line becomes the mark → end card (no chart going up) */
const LineToAscend: React.FC = () => {
  const f = useCurrentFrame();
  const m = interpolate(f, [10, 36], [0, 1], {...clamp, easing: enter});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: M, right: M, top: 240, height: 4, background: C.flare, opacity: 1 - m, transform: `scaleX(${1 - m})`, transformOrigin: '0 50%'}} />
      <div style={{position: 'absolute', left: M, top: 160, transform: `scale(${0.6 + m * 0.4})`, transformOrigin: '0 0', opacity: m}}>
        <AscendMark size={170} draw={m} id="ag3" />
      </div>
      <EndCard line="AI changed the market. Not your value." start={30} />
    </AbsoluteFill>
  );
};

export const FILM3_SCENES = {kpi: Kpis, cons: Consolidated, parse: Parse, bad: BadData, clean: Clean, fit: Fit, honest: Honest, end: LineToAscend};

export const Film3: React.FC<FilmProps> = (p) => <FilmShell compId="Film3" scenes={FILM3_SCENES} {...p} />;
export const Film3Short: React.FC<FilmProps> = (p) => <FilmShell compId="Film3Short" scenes={FILM3_SCENES} {...p} />;
export const Film3Vertical: React.FC<FilmProps> = (p) => <FilmShell compId="Film3Vertical" scenes={FILM3_SCENES} {...p} />;
