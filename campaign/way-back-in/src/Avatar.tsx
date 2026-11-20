import {ThreeCanvas} from '@remotion/three';
import {useMemo} from 'react';
import * as THREE from 'three';
import {interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {AURORA, C} from './theme';

/* Stylised 3D presenters, built from code so every look is original and license-clean.
   The head is a sculpted sphere (jaw, chin, cheekbones, brow, eye sockets); hair, fades and beards are
   painted layers that follow the head's surface. Mouth shapes come from tools/visemes.py:
   one [open, wide, round] triple per frame. */

export type AvatarStyle = {
  name: string;
  feminine: boolean;
  skin: string;
  lip: string;
  iris: string;
  hair: 'fade' | 'long' | 'wavy';
  hairColor: string;
  beard?: 'full' | 'stubble';
  glasses?: string;
  earrings?: string;
  outfit: 'cardigan' | 'blazer' | 'hoodie';
  top: string;    // outer layer
  inner: string;  // tee / blouse
  backdrop: string;
};

export const AVATARS: Record<'daniel' | 'priya' | 'tomas', AvatarStyle> = {
  daniel: {name: 'Daniel', feminine: false, skin: '#6A412F', lip: '#4E2A20', iris: '#2B1A10', hair: 'fade', hairColor: '#14100E',
    beard: 'full', outfit: 'cardigan', top: '#857E72', inner: '#E9E3D7', backdrop: '#201A28'},
  priya: {name: 'Priya', feminine: true, skin: '#B47A57', lip: '#9E4B55', iris: '#3A2414', hair: 'long', hairColor: '#17100E',
    earrings: '#E2B65A', outfit: 'blazer', top: '#24666B', inner: '#F2E9DC', backdrop: '#12222A'},
  tomas: {name: 'Tomás', feminine: false, skin: '#BF8962', lip: '#94594A', iris: '#3B2616', hair: 'wavy', hairColor: '#2A1B14',
    beard: 'stubble', glasses: '#141414', outfit: 'hoodie', top: '#3A4878', inner: '#D9DBE8', backdrop: '#161A30'},
};

type Viseme = [number, number, number];

/* ---------- sculpted head geometry ---------- */

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const sculptHead = (feminine: boolean) => {
  const g = new THREE.SphereGeometry(1, 128, 128);
  const p = g.attributes.position as THREE.BufferAttribute;
  const bump = (v: THREE.Vector3, c: [number, number, number], r: number, amp: number) => {
    const d2 = (v.x - c[0]) ** 2 + (v.y - c[1]) ** 2 + (v.z - c[2]) ** 2;
    return amp * Math.exp(-d2 / (r * r));
  };
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = v.clone().normalize();
    let disp = 0;
    disp += bump(v, [0.5, -0.02, 0.75], 0.28, 0.05) + bump(v, [-0.5, -0.02, 0.75], 0.28, 0.05); // cheekbones
    disp += bump(v, [0.31, 0.2, 0.9], 0.17, -0.06) + bump(v, [-0.31, 0.2, 0.9], 0.17, -0.06);   // eye sockets
    disp += bump(v, [0, 0.36, 0.92], 0.3, feminine ? 0.012 : 0.035);                            // brow ridge
    disp += bump(v, [0, -0.86, 0.5], 0.25, feminine ? 0.02 : 0.05);                             // chin
    disp += bump(v, [0.32, -0.28, 0.9], 0.12, -0.02) + bump(v, [-0.32, -0.28, 0.9], 0.12, -0.02); // mouth corners
    v.addScaledVector(n, disp);
    // jaw taper below the cheekbones
    if (v.y < 0.1) {
      const t = (0.1 - v.y) / 1.1;
      v.x *= 1 - (feminine ? 0.34 : 0.22) * t * t;
      v.z *= 1 - 0.06 * t * t;
    }
    // flatter face plane, fuller back of the skull
    if (v.z > 0.3) v.z = 0.3 + (v.z - 0.3) * 0.88;
    if (v.z < -0.2 && v.y > -0.1) v.z *= 1.06;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
};

// A copy of the head surface with per-vertex alpha, used for hairlines, fades and beards.
const paintedLayer = (head: THREE.BufferGeometry, color: string, alpha: (x: number, y: number, z: number) => number) => {
  const g = head.clone();
  const p = g.attributes.position as THREE.BufferAttribute;
  const c = new THREE.Color(color);
  const cols = new Float32Array(p.count * 4);
  for (let i = 0; i < p.count; i++) {
    cols.set([c.r, c.g, c.b, alpha(p.getX(i), p.getY(i), p.getZ(i))], i * 4);
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 4));
  return g;
};

const beardAlpha = (density: number) => (x: number, y: number, z: number) => {
  if (z < -0.3) return 0;
  const ax = Math.abs(x);
  // jawline boundary: mouth corner -> lower cheek -> narrow sideburn up to the ear
  const top = -0.4 + 0.3 * smooth(0.3, 0.85, ax);
  let a = 1 - smooth(top - 0.05, top + 0.04, y);
  if (ax > 0.78 && z < 0.5 && y < 0.18) a = Math.max(a, 1 - smooth(0.12, 0.18, y)); // sideburn
  if (ax > 0.9 && y > -0.15) a = 0;                        // stop at the ear
  const lips = (x / 0.29) ** 2 + ((y + 0.355) / 0.085) ** 2;  // keep the lips clear
  if (lips < 1) a = 0;
  const mustache = ax < 0.28 && y > -0.3 && y < -0.24 && z > 0.5 ? 0.9 : 0;
  return Math.max(a, mustache) * density;
};

/* ---------- face ---------- */

const Eye: React.FC<{s: AvatarStyle; side: number; blink: number; look: number}> = ({s, side, blink, look}) => {
  const lid = Math.PI * (0.34 + 0.66 * (1 - blink));
  const skin = new THREE.Color(s.skin).multiplyScalar(0.92).getStyle();
  return (
    <group position={[side * 0.285, 0.76, 0.69]}>
      <mesh><sphereGeometry args={[0.118, 32, 32]} /><meshStandardMaterial color="#EFE9E1" roughness={0.25} /></mesh>
      <group rotation={[0, look, 0]}>
        <mesh position={[0, 0, 0.082]}><sphereGeometry args={[0.062, 24, 24]} /><meshStandardMaterial color={s.iris} roughness={0.2} /></mesh>
        <mesh position={[0, 0, 0.11]}><sphereGeometry args={[0.029, 16, 16]} /><meshStandardMaterial color="#050505" roughness={0.1} /></mesh>
        <mesh position={[0.02, 0.026, 0.124]}><sphereGeometry args={[0.012, 8, 8]} /><meshBasicMaterial color="#FFFFFF" /></mesh>
      </group>
      {/* upper lid */}
      <mesh rotation={[-0.25, 0, 0]}><sphereGeometry args={[0.126, 32, 16, 0, Math.PI * 2, 0, lid]} /><meshStandardMaterial color={skin} roughness={0.6} /></mesh>
      {/* lower lid */}
      <mesh rotation={[0.2, 0, 0]}><sphereGeometry args={[0.124, 32, 16, 0, Math.PI * 2, Math.PI * 0.8, Math.PI * 0.2]} /><meshStandardMaterial color={skin} roughness={0.6} /></mesh>
      {s.feminine && blink > 0.6 && (
        <mesh position={[0, 0.014, 0.04]} rotation={[-0.55, 0, side < 0 ? 0.12 : -0.12]}>
          <torusGeometry args={[0.122, 0.017, 8, 32, Math.PI]} /><meshStandardMaterial color="#0C0808" roughness={0.6} />
        </mesh>
      )}
    </group>
  );
};

const Brow: React.FC<{s: AvatarStyle; side: number; lift: number}> = ({s, side, lift}) => {
  const r = s.feminine ? 0.17 : 0.3;
  const arc = s.feminine ? 1.15 : 0.62;
  const tube = s.feminine ? 0.02 : 0.036;
  return (
    <mesh position={[side * 0.28, 0.93 + lift - r, 0.79]} rotation={[-0.2, side * 0.12, Math.PI / 2 - arc / 2 + side * 0.06]}>
      <torusGeometry args={[r, tube, 8, 32, arc]} /><meshStandardMaterial color={s.hairColor} roughness={0.9} />
    </mesh>
  );
};

const Nose: React.FC<{s: AvatarStyle}> = ({s}) => {
  const m = <meshStandardMaterial color={s.skin} roughness={0.55} />;
  const w = s.feminine ? 0.85 : 1;
  return (
    <group scale={[w, 1, 1]}>
      <mesh position={[0, 0.63, 0.83]} rotation={[0.35, 0, 0]}><capsuleGeometry args={[0.05, 0.16, 8, 16]} />{m}</mesh>
      <mesh position={[0, 0.5, 0.88]}><sphereGeometry args={[0.065, 24, 24]} />{m}</mesh>
      {[-1, 1].map((d) => <mesh key={d} position={[d * 0.07, 0.475, 0.81]}><sphereGeometry args={[0.045, 16, 16]} />{m}</mesh>)}
    </group>
  );
};

const Mouth: React.FC<{s: AvatarStyle; v: Viseme}> = ({s, v}) => {
  const [open, wide, round] = v;
  const w = (s.feminine ? 0.25 : 0.27) * (1 + 0.25 * wide - 0.35 * round);
  const h = 0.008 + 0.12 * open * (1 - 0.35 * wide);
  const z = 0.83 + round * 0.035;
  const upper = s.feminine ? 0.03 : 0.022;
  const lower = s.feminine ? 0.036 : 0.028;
  return (
    <group position={[0, 0.17, 0]}>
      <mesh position={[0, 0, z - 0.035]} scale={[w / 0.2, Math.max(0.04, h / 0.2), 0.3]}>
        <sphereGeometry args={[0.2, 32, 16]} /><meshStandardMaterial color="#2A0E0E" roughness={0.8} />
      </mesh>
      <mesh position={[0, h * 0.32, z - 0.012]} visible={open > 0.15 && round < 0.6}>
        <boxGeometry args={[w * 1.25, Math.min(0.045, h * 0.4), 0.02]} /><meshStandardMaterial color="#F2EDE5" roughness={0.4} />
      </mesh>
      <mesh position={[0, h / 2 + upper * 0.4, z]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.75]}>
        <capsuleGeometry args={[upper, w * 1.45, 8, 16]} /><meshStandardMaterial color={s.lip} roughness={0.45} />
      </mesh>
      <mesh position={[0, -h / 2 - lower * 0.45, z - 0.005]} rotation={[0, 0, Math.PI / 2]} scale={[1.1, 1, 0.8]}>
        <capsuleGeometry args={[lower, w * 1.25, 8, 16]} /><meshStandardMaterial color={s.lip} roughness={0.45} />
      </mesh>
    </group>
  );
};

/* ---------- hair ---------- */

const Hair: React.FC<{s: AvatarStyle; head: THREE.BufferGeometry}> = ({s, head}) => {
  const mat = <meshStandardMaterial color={s.hairColor} roughness={0.9} />;
  const layers = useMemo(() => {
    if (s.hair === 'fade') {
      // crisp line-up at the forehead and temples, short on top, fading down the sides
      const top = paintedLayer(head, s.hairColor, (x, y, z) => {
        const front = z > 0.55 ? smooth(0.6, 0.66, y) : 1;
        const temple = Math.abs(x) > 0.6 && z > 0.2 ? smooth(0.42, 0.5, y) : 1;
        return smooth(0.32, 0.4, y) * front * temple;
      });
      const fade = paintedLayer(head, s.hairColor, (x, y, z) => {
        if (z > 0.35 && Math.abs(x) < 0.75) return 0;
        if (Math.abs(x) > 0.8 && y < 0.25 && y > -0.2 && z > -0.2) return 0; // around the ear
        return smooth(-0.05, 0.4, y) * 0.75;
      });
      return {top, fade};
    }
    return {top: paintedLayer(head, s.hairColor, (x, y, z) => smooth(0.25, 0.33, y + (z > 0.5 ? -0.28 : 0))), fade: null};
  }, [s, head]);

  return (
    <group>
      {s.hair !== 'long' && (
        <mesh geometry={layers.top} scale={s.hair === 'fade' ? 1.03 : 1.045}>
          <meshStandardMaterial vertexColors transparent depthWrite={false} roughness={0.95} />
        </mesh>
      )}
      {layers.fade && (
        <mesh geometry={layers.fade} scale={1.012}><meshStandardMaterial vertexColors transparent depthWrite={false} roughness={1} /></mesh>
      )}
      {s.hair === 'long' && (
        <>
          {/* centre part: two swept halves over the crown */}
          {[-1, 1].map((d) => (
            <mesh key={d} position={[d * 0.03, 0.02, -0.06]} rotation={[-0.42, 0, d * 0.05]} scale={[1.07, 1.1, 1.08]}>
              <sphereGeometry args={[1, 64, 32, d < 0 ? Math.PI / 2 : -Math.PI / 2, Math.PI, 0, Math.PI * 0.42]} />{mat}
            </mesh>
          ))}
          {/* side lengths framing the face, resting on the shoulders */}
          {[-1, 1].map((d) => (
            <mesh key={`s${d}`} position={[d * 0.84, -0.12, 0.08]} rotation={[0.06, 0, d * 0.06]} scale={[0.5, 1, 0.9]}>
              <capsuleGeometry args={[0.34, 1.45, 12, 24]} />{mat}
            </mesh>
          ))}
          <mesh position={[0, -0.25, -0.38]} scale={[1.08, 1, 0.62]}><capsuleGeometry args={[0.85, 1.0, 16, 32]} />{mat}</mesh>
        </>
      )}
      {s.hair === 'wavy' && (
        <>
          <mesh position={[0, 0.06, -0.03]} scale={[1.04, 1.08, 1.06]}><sphereGeometry args={[1, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.36]} />{mat}</mesh>
          {new Array(11).fill(0).map((_, i) => {
            const a = (i / 10) * Math.PI * 1.1 - Math.PI * 0.55;
            const r = 0.24 + random(`w${i}`) * 0.06;
            return <mesh key={i} position={[Math.sin(a) * 0.66, 0.93 + Math.cos(a) * 0.12 + random(`h${i}`) * 0.06, Math.cos(a) * 0.42 + 0.05]}>
              <sphereGeometry args={[r, 24, 24]} />{mat}
            </mesh>;
          })}
          {[-1, 1].map((d) => (
            <mesh key={`b${d}`} position={[d * 0.82, 0.38, 0]} scale={[0.4, 1, 0.9]}><sphereGeometry args={[0.32, 24, 24]} />{mat}</mesh>
          ))}
        </>
      )}
    </group>
  );
};

/* ---------- clothes ---------- */

const Body: React.FC<{s: AvatarStyle; frame: number}> = ({s, frame}) => {
  const breathe = 1 + Math.sin((frame / 30) * 1.6) * 0.008;
  const sx = s.feminine ? 1.02 : 1.2;
  const outer = <meshStandardMaterial color={s.top} roughness={0.85} side={THREE.DoubleSide} />;
  const inner = <meshStandardMaterial color={s.inner} roughness={0.8} />;
  const gap = s.outfit === 'hoodie' ? 0 : s.outfit === 'blazer' ? 0.42 : 0.3;
  const lapel = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(0, 0); sh.lineTo(0.36, 0.62); sh.lineTo(0.16, 0.66); sh.lineTo(0.05, 0.3); sh.lineTo(0, 0);
    return sh;
  }, []);
  return (
    <group scale={[1, breathe, 1]}>
      <mesh position={[0, -0.42, -0.02]}><cylinderGeometry args={[0.27, 0.32, 0.7, 32]} /><meshStandardMaterial color={s.skin} roughness={0.6} /></mesh>
      <group position={[0, -1.55, -0.05]} scale={[sx, 1, 0.7]}>
        {/* inner layer */}
        <mesh><capsuleGeometry args={[0.88, 0.9, 16, 48]} />{inner}</mesh>
        {/* outer layer, open at the front (except the hoodie) */}
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.915, 0.915, 1.3, 64, 1, true, gap, Math.PI * 2 - gap * 2]} />{outer}
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.915, 64, 32, Math.PI / 2 + gap, Math.PI * 2 - gap * 2, 0, Math.PI / 2]} />{outer}
        </mesh>
      </group>
      {s.outfit === 'cardigan' && (
        <>
          <mesh position={[0, -0.82, 0.02]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.33, 0.05, 12, 40]} />{inner}</mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0.31 * sx * 0.92, -1.32 - i * 0.24, 0.63]}><sphereGeometry args={[0.035, 12, 12]} /><meshStandardMaterial color="#3A332C" /></mesh>
          ))}
        </>
      )}
      {s.outfit === 'blazer' && (
        <>
          <mesh position={[0, -0.86, 0.04]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.6]}><torusGeometry args={[0.3, 0.035, 12, 40]} />{inner}</mesh>
          {[-1, 1].map((d) => (
            <mesh key={d} position={[d * 0.08, -1.62, 0.62]} rotation={[-0.25, d * 0.35, 0]} scale={[d, 1, 1]}>
              <extrudeGeometry args={[lapel, {depth: 0.03, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2}]} />
              <meshStandardMaterial color={new THREE.Color(s.top).multiplyScalar(0.85).getStyle()} roughness={0.7} />
            </mesh>
          ))}
        </>
      )}
      {s.outfit === 'hoodie' && (
        <>
          {/* hood bunched behind the neck */}
          <mesh position={[0, -0.9, -0.25]} rotation={[Math.PI / 2 + 0.25, 0, 0]} scale={[1.15, 1, 1]}>
            <torusGeometry args={[0.46, 0.16, 16, 48]} /><meshStandardMaterial color={s.top} roughness={0.9} />
          </mesh>
          {[-1, 1].map((d) => (
            <group key={d}>
              <mesh position={[d * 0.15, -1.3, 0.62]} rotation={[0.15, 0, d * 0.05]}><cylinderGeometry args={[0.014, 0.014, 0.55, 8]} /><meshStandardMaterial color="#E6E6EE" /></mesh>
              <mesh position={[d * 0.16, -1.58, 0.65]}><cylinderGeometry args={[0.02, 0.02, 0.07, 8]} /><meshStandardMaterial color="#9A9AA6" metalness={0.6} roughness={0.3} /></mesh>
            </group>
          ))}
        </>
      )}
    </group>
  );
};

/* ---------- assembly ---------- */

const Person: React.FC<{s: AvatarStyle; v: Viseme; frame: number; fps: number}> = ({s, v, frame, fps}) => {
  const head = useMemo(() => sculptHead(s.feminine), [s.feminine]);
  const beard = useMemo(() => (s.beard ? paintedLayer(head, s.hairColor, beardAlpha(s.beard === 'full' ? 0.95 : 0.4)) : null), [s, head]);
  const t = frame / fps;
  const sway = Math.sin(t * 0.55) * 0.07 + Math.sin(t * 1.3) * 0.02;
  const nod = Math.sin(t * 0.8) * 0.03 - v[0] * 0.05;
  const cycle = 105 + Math.floor(random(`b${Math.floor(frame / 105)}`) * 20);
  const k = frame % cycle;
  const blink = k < 5 ? [1, 0.45, 0.05, 0.45, 1][k] : 1;
  const brow = 0.012 * Math.sin(t * 2.1) + v[0] * 0.03;
  const look = Math.sin(t * 0.4) * 0.08;
  const skinMat = <meshPhysicalMaterial color={s.skin} roughness={0.55} sheen={0.4} sheenColor="#FF9A80" sheenRoughness={0.6} />;

  return (
    <group rotation={[nod, sway, sway * 0.15]}>
      <group position={[0, 0.55, 0]} scale={[s.feminine ? 0.8 : 0.86, 1.08, 0.95]}>
        <mesh geometry={head}>{skinMat}</mesh>
        {beard && <mesh geometry={beard} scale={1.012}><meshStandardMaterial vertexColors transparent depthWrite={false} roughness={1} /></mesh>}
      </group>
      <group position={[0, 0.55, 0]} scale={[s.feminine ? 0.8 : 0.86, 1.08, 0.95]}>
        <Hair s={s} head={head} />
      </group>
      {[-1, 1].map((d) => (
        <mesh key={d} position={[d * (s.feminine ? 0.78 : 0.84), 0.55, -0.05]} rotation={[0, d * 0.3, 0]} scale={[0.42, 1, 0.65]}><sphereGeometry args={[0.2, 24, 24]} />{skinMat}</mesh>
      ))}
      {s.earrings && [-1, 1].map((d) => (
        <mesh key={`e${d}`} position={[d * (s.feminine ? 0.8 : 0.86), 0.33, 0]}><torusGeometry args={[0.05, 0.012, 8, 24]} /><meshStandardMaterial color={s.earrings} metalness={0.85} roughness={0.25} /></mesh>
      ))}
      {[-1, 1].map((d) => <Eye key={d} s={s} side={d} blink={blink} look={look} />)}
      {[-1, 1].map((d) => <Brow key={d} s={s} side={d} lift={brow} />)}
      <Nose s={s} />
      <Mouth s={s} v={v} />
      {s.glasses && (
        <group position={[0, 0.77, 0.86]}>
          {[-1, 1].map((d) => (
            <mesh key={d} position={[d * 0.275, 0, 0]}><torusGeometry args={[0.165, 0.022, 12, 48]} /><meshStandardMaterial color={s.glasses} roughness={0.35} /></mesh>
          ))}
          <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.018, 0.018, 0.22, 8]} /><meshStandardMaterial color={s.glasses} /></mesh>
          {[-1, 1].map((d) => (
            <mesh key={`a${d}`} position={[d * 0.45, 0.02, -0.38]}><boxGeometry args={[0.02, 0.025, 0.75]} /><meshStandardMaterial color={s.glasses} /></mesh>
          ))}
        </group>
      )}
      <Body s={s} frame={frame} />
    </group>
  );
};

export const AvatarBubble: React.FC<{style: AvatarStyle; visemes: Viseme[]; size?: number; opacity?: number}> = ({style, visemes, size = 250, opacity = 1}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const v = visemes[Math.min(frame, visemes.length - 1)] ?? [0, 0, 0];
  const talk = interpolate(v[0], [0, 0.3], [0, 1], {extrapolateRight: 'clamp'});
  const px = size - 8;
  return (
    <div style={{width: size, height: size, borderRadius: '50%', padding: 4, background: AURORA, opacity,
      boxShadow: `0 18px 60px rgba(0,0,0,.55), 0 0 ${18 + talk * 22}px rgba(123,97,255,${0.25 + talk * 0.25})`}}>
      <div style={{width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
        background: `radial-gradient(80% 80% at 50% 30%, ${style.backdrop} 0%, ${C.ink} 100%)`}}>
        <ThreeCanvas width={px} height={px} gl={{antialias: true}} camera={{fov: 25, position: [0, 0.2, 7.4]}}>
          <ambientLight intensity={0.45} />
          <hemisphereLight args={['#FFF4E8', '#1A1530', 0.55]} />
          <directionalLight position={[-3, 4, 5]} intensity={2.2} color="#FFE9D6" />
          <directionalLight position={[3, 0.5, 4]} intensity={0.5} color="#D6E2FF" />
          <directionalLight position={[3, 1.5, -3]} intensity={1.6} color={C.cyan} />
          <directionalLight position={[-3, 1, -3]} intensity={1.2} color={C.magenta} />
          <group position={[0, -0.12, 0]}>
            <Person s={style} v={v} frame={frame} fps={fps} />
          </group>
        </ThreeCanvas>
      </div>
    </div>
  );
};
