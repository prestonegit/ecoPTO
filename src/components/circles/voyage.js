// The ecoPTO sky: a place you travel through, not a chart you magnify.
//
//   The sky     ecoPTO's galaxy at the centre, every team a star orbiting it. Teams that share
//               people are joined by faint gold constellation lines.
//   A system    click a star and you fly into it: the team's star fills the middle, its projects
//               are planets on their own orbits, its members circle close as satellites, and
//               anyone who also belongs to another team is a comet whose orbit swings out toward
//               that team's star on the horizon.
//   A planet    click a planet and the camera swoops in; its people orbit as named moons.
//
// Visual language (tints, rayed stars, spiral galaxy, nebulae) follows the Constellation
// prototype on feature/independent-learning-log. GSAP drives every change over time; a ticker
// turns the state into SVG attributes each frame.

import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(DrawSVGPlugin, SplitText);

const NS = 'http://www.w3.org/2000/svg';
const TAU = Math.PI * 2;
const GREEK = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ'];
const TINT_KEYS = ['amber', 'ice', 'gold', 'rose', 'white'];
const TINT = {
  ice: { core: '#EAF3FF', mid: '#B9D2FF', edge: 'rgba(150,180,255,0)', ring: '#BBD4FF', hot: '#FFFFFF' },
  white: { core: '#FFFEF8', mid: '#FFE9C8', edge: 'rgba(255,210,150,0)', ring: '#FFE9C8', hot: '#FFFFFF' },
  gold: { core: '#FFFAE8', mid: '#FFD27F', edge: 'rgba(255,200,120,0)', ring: '#FFD888', hot: '#FFF6DC' },
  amber: { core: '#FFEFD0', mid: '#FFAE5A', edge: 'rgba(255,150,80,0)', ring: '#FFB066', hot: '#FFEFCE' },
  rose: { core: '#FFE9E4', mid: '#FF9E86', edge: 'rgba(255,140,120,0)', ring: '#FF9E86', hot: '#FFF0EC' },
};
const PLANET_COLORS = ['#E0A36B', '#7FB7B0', '#9DA8E0', '#D98C8C', '#B9A0DC', '#C9C27A', '#8FC49A'];
const GOLD = '#FFD27F';

const svgEl = (tag, attrs = {}, parent) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (parent) parent.appendChild(el);
  return el;
};
const mix = (hex, to, amt) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${[n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (to - v) * amt)).join(',')})`;
};
const rand = (a, b) => a + Math.random() * (b - a);
const deg = (rad) => (rad * 180) / Math.PI;

export function mountVoyage(stage, data) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const abort = new AbortController();
  const on = (el, type, fn, opts = {}) => el.addEventListener(type, fn, { ...opts, signal: abort.signal });

  const svg = stage.querySelector('.vy-svg');
  const defs = svg.querySelector('defs');
  const bgLayer = svgEl('g', { class: 'vy-bg' }, svg);
  const skyLayer = svgEl('g', { class: 'vy-sky' }, svg);
  const sysLayer = svgEl('g', { class: 'vy-system' }, svg);
  const warpLayer = svgEl('g', { class: 'vy-warp' }, svg);
  const flash = stage.querySelector('.vy-flash');
  const crumbs = stage.querySelector('.vy-crumbs');
  const panel = stage.querySelector('.vy-panel');
  const tip = stage.querySelector('.vy-tip');
  const hero = stage.querySelector('.vy-hero');
  const search = stage.querySelector('.vy-search input');
  const results = stage.querySelector('.vy-results');

  // ---------------------------------------------------------------- gradients
  const radial = (id, stops, attrs = {}) => {
    const g = svgEl('radialGradient', { id, cx: '50%', cy: '50%', r: '50%', ...attrs }, defs);
    for (const [o, c] of stops) svgEl('stop', { offset: o, 'stop-color': c }, g);
    return g;
  };
  for (const [k, t] of Object.entries(TINT)) radial(`vy-tint-${k}`, [['0%', t.core], ['38%', t.mid], ['100%', t.edge]]);
  radial('vy-root-glow', [['0%', 'rgba(255,228,180,0.7)'], ['45%', 'rgba(255,160,110,0.24)'], ['100%', 'rgba(255,160,110,0)']]);
  radial('vy-milky', [['0%', 'rgba(255,242,224,0.20)'], ['55%', 'rgba(214,200,255,0.07)'], ['100%', 'rgba(214,200,255,0)']]);
  radial('vy-neb-warm', [['0%', 'rgba(204,112,72,0.5)'], ['55%', 'rgba(204,112,72,0.12)'], ['100%', 'rgba(204,112,72,0)']]);
  radial('vy-neb-rose', [['0%', 'rgba(222,128,158,0.42)'], ['100%', 'rgba(222,128,158,0)']]);
  radial('vy-neb-violet', [['0%', 'rgba(132,92,184,0.44)'], ['100%', 'rgba(132,92,184,0)']]);
  radial('vy-neb-teal', [['0%', 'rgba(92,150,180,0.32)'], ['100%', 'rgba(92,150,180,0)']]);

  // A rayed star, as in the Constellation prototype: glow, crossed light-bars, core, hot centre.
  const drawStar = (parent, r, key, bars) => {
    const tint = `url(#vy-tint-${key})`;
    const g = svgEl('g', { class: 'vy-star' }, parent);
    const glow = svgEl('circle', { r: r * 1.9, fill: tint, opacity: 0.82 }, g);
    const rays = svgEl('g', {}, g);
    const w = Math.max(0.45, r * 0.05), L = r * 2.1;
    for (let i = 0; i < bars; i++) {
      svgEl('path', { d: `M0,${-L} L${w},0 L0,${L} L${-w},0 Z`, transform: `rotate(${(i * 180) / bars})`, fill: tint, opacity: 0.94 }, rays);
    }
    svgEl('circle', { r: r * 0.72, fill: tint }, g);
    svgEl('circle', { r: r * 0.34, fill: TINT[key].hot }, g);
    return { g, glow, rays };
  };

  // ---------------------------------------------------------------- model
  const teams = data.root.children.map((d, i, all) => {
    const everyone = new Set([...d.people, ...d.children.flatMap((c) => c.people)]);
    const N = all.length;
    const orbitR = N > 1 ? 170 + (190 * i) / (N - 1) : 260;
    return {
      d, i,
      id: d.id,
      tint: TINT_KEYS[i % TINT_KEYS.length],
      greek: GREEK[i % GREEK.length],
      members: everyone.size,
      r: 7 + Math.sqrt(everyone.size) * 4.5,
      bars: Math.max(2, Math.min(12, Math.round(everyone.size / 1.5))),
      orbitR,
      a0: i * 2.39996,
      period: 70 + ((orbitR - 170) / 190) * 80,
      hover: 1,
      planets: d.children.map((c, j) => ({ d: c, j, id: c.id, color: PLANET_COLORS[(i * 2 + j) % PLANET_COLORS.length] })),
    };
  });
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const where = new Map(); // circle id -> { team, planet? }
  for (const t of teams) {
    where.set(t.id, { team: t });
    for (const p of t.planets) where.set(p.id, { team: t, planet: p });
  }
  const people = data.people.map((p) => ({
    name: p.name,
    places: p.circles.map((id) => where.get(id)).filter(Boolean),
  }));
  const circleTitle = (w) => (w.planet ? w.planet.d.title : w.team.d.title);

  // ---------------------------------------------------------------- backdrop: shared starfield
  const bgStars = [];
  for (let i = 0; i < 260; i++) {
    const s = svgEl('circle', {
      cx: rand(-1100, 1100), cy: rand(-620, 620), r: rand(0.35, 1.8),
      fill: Math.random() < 0.16 ? '#FFD9A8' : '#FFF6E8', opacity: rand(0.2, 0.8),
    }, bgLayer);
    bgStars.push(s);
  }

  // ---------------------------------------------------------------- the sky
  const sky = { cam: { x: 0, y: 0, k: 1 }, fitK: 1 };
  const skyBack = svgEl('g', {}, skyLayer);
  [['vy-neb-warm', 20, 10, 430, 300, 0.7], ['vy-neb-violet', -350, 260, 360, 280, 0.6], ['vy-neb-rose', 260, -200, 300, 230, 0.5],
    ['vy-neb-teal', 380, 160, 280, 210, 0.4], ['vy-neb-warm', -420, -150, 250, 210, 0.45]].forEach(([id, x, y, rx, ry, op]) =>
    svgEl('ellipse', { cx: x, cy: y, rx, ry, fill: `url(#${id})`, opacity: op }, skyBack));
  svgEl('ellipse', { rx: 980, ry: 210, transform: 'rotate(-22)', fill: 'url(#vy-milky)', opacity: 0.78 }, skyBack);
  const skyOrbits = svgEl('g', {}, skyLayer);
  for (const t of teams) svgEl('circle', { class: 'vy-orbit', r: t.orbitR }, skyOrbits);
  const spokeLayer = svgEl('g', {}, skyLayer);
  const linkLayer = svgEl('g', {}, skyLayer);
  const skyNodes = svgEl('g', {}, skyLayer);

  // ecoPTO: a small spiral galaxy that slowly turns.
  const eco = svgEl('g', { class: 'vy-eco' }, skyNodes);
  const galaxy = svgEl('g', {}, eco);
  const ecoR = 46;
  svgEl('ellipse', { rx: ecoR * 2.5, ry: ecoR * 1.15, fill: 'url(#vy-root-glow)', opacity: 0.5 }, galaxy);
  for (const [off, col] of [[0, '#FFEAC8'], [Math.PI, '#FFD9B6']]) {
    for (let a = 0.5; a < 3 * Math.PI; a += 0.34) {
      const rad = ecoR * 0.32 * Math.exp(0.235 * a);
      if (rad > ecoR * 2.5) break;
      const t = a / (3 * Math.PI);
      svgEl('circle', { cx: Math.cos(a + off) * rad, cy: Math.sin(a + off) * rad * 0.52, r: Math.max(0.6, ecoR * 0.14 * (1 - t)), fill: col, opacity: 0.85 * (1 - t * 0.8) }, galaxy);
    }
  }
  svgEl('ellipse', { rx: ecoR * 0.95, ry: ecoR * 0.6, fill: 'url(#vy-tint-white)' }, galaxy);
  svgEl('circle', { r: ecoR * 0.5, fill: '#FFF3D6' }, galaxy);
  svgEl('circle', { r: ecoR * 0.24, fill: '#FFFFFF' }, galaxy);
  const ecoLabel = svgEl('text', { class: 'vy-eco-label', y: ecoR * 1.5 + 8, 'text-anchor': 'middle' }, eco);
  ecoLabel.textContent = 'ecoPTO';

  for (const t of teams) {
    t.spoke = svgEl('line', { class: 'vy-spoke' }, spokeLayer);
    t.g = svgEl('g', {
      class: 'vy-team', tabindex: '0', role: 'button', 'data-team': t.id,
      'aria-label': `${t.d.title}: ${t.members} people, ${t.planets.length} projects. Travel there.`,
    }, skyNodes);
    t.body = svgEl('g', {}, t.g);
    t.star = drawStar(t.body, t.r, t.tint, t.bars);
    t.moons = Array.from({ length: t.members }, () => {
      const m = { a0: rand(0, TAU), r: t.r * 1.7 + rand(0, t.r * 0.8), w: rand(0.3, 0.7) * (Math.random() < 0.5 ? 1 : -1) };
      m.el = svgEl('circle', { class: 'vy-moonlet', r: 1.4 }, t.body);
      return m;
    });
    const label = svgEl('text', { class: 'vy-star-label', y: t.r * 2.1 + 14, 'text-anchor': 'middle' }, t.g);
    const gk = svgEl('tspan', { class: 'vy-greek' }, label);
    gk.textContent = `${t.greek}  `;
    label.appendChild(document.createTextNode(t.d.title));
    t.label = label;
    svgEl('circle', { r: t.r * 2.2 + 8, fill: 'transparent', class: 'vy-hit' }, t.g);
  }

  // Constellation lines: a faint gold thread between any two teams that share someone.
  const links = [];
  for (const a of teams) for (const b of teams) {
    if (a.i >= b.i) continue;
    const shared = people.filter((p) => p.places.some((w) => w.team === a) && p.places.some((w) => w.team === b)).map((p) => p.name);
    if (shared.length) links.push({ a, b, shared, el: svgEl('path', { class: 'vy-link' }, linkLayer) });
  }

  const skyClock = { t: 0 };
  const skyTween = gsap.to(skyClock, { t: 1e5, duration: 1e5, ease: 'none', repeat: -1 });
  const placeSky = () => {
    for (const t of teams) {
      const a = t.a0 + (TAU * skyClock.t) / t.period;
      t.x = Math.cos(a) * t.orbitR;
      t.y = Math.sin(a) * t.orbitR;
    }
  };

  const renderSky = () => {
    const c = sky.cam;
    skyLayer.setAttribute('transform', `scale(${c.k}) translate(${-c.x},${-c.y})`);
    for (const t of teams) {
      t.g.setAttribute('transform', `translate(${t.x},${t.y})`);
      t.body.setAttribute('transform', `scale(${t.hover})`);
      t.spoke.setAttribute('x2', t.x);
      t.spoke.setAttribute('y2', t.y);
      for (const m of t.moons) {
        const a = m.a0 + m.w * skyClock.t;
        m.el.setAttribute('cx', Math.cos(a) * m.r);
        m.el.setAttribute('cy', Math.sin(a) * m.r);
      }
    }
    for (const l of links) {
      const mx = (l.a.x + l.b.x) / 2, my = (l.a.y + l.b.y) / 2;
      // bow each thread away from the galaxy so it doesn't cut through the centre
      const len = Math.hypot(mx, my) || 1;
      const bow = 70;
      l.el.setAttribute('d', `M${l.a.x},${l.a.y} Q${mx + (mx / len) * bow},${my + (my / len) * bow} ${l.b.x},${l.b.y}`);
    }
  };

  // ---------------------------------------------------------------- sizing
  let unitPx = 1;
  const measure = () => {
    const r = svg.getBoundingClientRect();
    unitPx = Math.min(r.width, r.height) / 1000;
    return r;
  };
  measure();
  // Fit a circle of `extent` around (x,y) into the space the panel leaves free.
  const fit = (x, y, extent, withPanel) => {
    const r = measure();
    let availW = r.width, availH = r.height, offX = 0, offY = 0;
    if (withPanel) {
      const pr = panel.getBoundingClientRect();
      if (r.width >= 900) { availW -= pr.width + 24; offX = -(pr.width + 24) / 2; }
      else { const h = Math.min(pr.height, r.height * 0.55); availH -= h; offY = -h / 2; }
    }
    const k = Math.min(availW, availH) / (2 * extent * unitPx);
    return { x: x - offX / (unitPx * k), y: y - offY / (unitPx * k), k };
  };

  // ---------------------------------------------------------------- a star system
  const sys = { team: null, cam: { x: 0, y: 0, k: 1 }, follow: null, fly: 1, from: null };
  const sysClock = { t: 0 };
  const sysTween = gsap.to(sysClock, { t: 1e5, duration: 1e5, ease: 'none', repeat: -1 });
  let sysDefs = [];
  let lastSysT = 0;

  const buildSystem = (team) => {
    if (sys.S) gsap.killTweensOf([sys.S.star.rays, sys.S.star.glow, ...sys.S.planets, ...sys.S.root.querySelectorAll('*')]);
    sysLayer.replaceChildren();
    sysDefs.forEach((d) => d.remove());
    sysDefs = [];
    placeSky(); // snapshot where everything is in the sky, for the horizon
    const S = { team, planets: [], satellites: [], comets: [], horizon: [] };
    const tint = TINT[team.tint];
    const root = svgEl('g', {}, sysLayer);
    S.root = root;

    // ambience: a nebula washed in the star's own colour
    svgEl('circle', { r: 520, fill: `url(#vy-tint-${team.tint})`, opacity: 0.1 }, root);
    svgEl('ellipse', { rx: 620, ry: 180, transform: 'rotate(-18)', fill: 'url(#vy-milky)', opacity: 0.5 }, root);

    // the horizon: every other team's star, in its true direction from here
    const horizon = svgEl('g', {}, root);
    const dirTo = (x, y) => Math.atan2(y - team.y, x - team.x);
    const addBeacon = (angle, key, r, text, target, cls = '') => {
      const g = svgEl('g', { class: `vy-beacon ${cls}`, tabindex: '0', role: 'button', 'aria-label': `Travel to ${text}` }, horizon);
      g.setAttribute('transform', `translate(${Math.cos(angle) * 455},${Math.sin(angle) * 455})`);
      if (key) drawStar(g, r, key, 4);
      else {
        svgEl('ellipse', { rx: 22, ry: 10, fill: 'url(#vy-root-glow)', transform: 'rotate(20)' }, g);
        svgEl('circle', { r: 3.5, fill: '#FFF3D6' }, g);
      }
      const lab = svgEl('text', { class: 'vy-beacon-label', 'text-anchor': 'middle', y: r * 2.4 + 12 }, g);
      lab.textContent = text;
      svgEl('circle', { r: 26, fill: 'transparent' }, g);
      g._target = target;
      S.horizon.push({ g, angle, target });
      return g;
    };
    addBeacon(dirTo(0, 0), null, 6, 'ecoPTO', { sky: true });
    for (const o of teams) if (o !== team) addBeacon(dirTo(o.x, o.y), o.tint, 5.5, o.d.title, { team: o });

    // orbits and planets
    const n = team.planets.length;
    const gap = n ? Math.min(82, 230 / n) : 0;
    const orbitsG = svgEl('g', {}, root);
    const planetsG = svgEl('g', {}, root);
    team.planets.forEach((p, j) => {
      const P = {
        p, j,
        orbit: 175 + j * gap,
        a0: rand(0, TAU),
        period: 38 + j * 16,
        r: 20 + Math.min(12, p.d.people.length * 3.5),
        hover: 1,
        appear: 1,
      };
      P.orbitEl = svgEl('circle', { class: 'vy-sys-orbit', r: P.orbit }, orbitsG);
      const gid = `vy-pl-${p.id}`;
      const grad = svgEl('radialGradient', { id: gid, cx: '38%', cy: '50%', r: '62%', fx: '22%', fy: '50%' }, defs);
      svgEl('stop', { offset: '0', 'stop-color': mix(p.color, 255, 0.45) }, grad);
      svgEl('stop', { offset: '0.55', 'stop-color': p.color }, grad);
      svgEl('stop', { offset: '1', 'stop-color': mix(p.color, 20, 0.62) }, grad);
      sysDefs.push(grad);
      P.g = svgEl('g', { class: 'vy-planet', tabindex: '0', role: 'button', 'aria-label': `${p.d.title}, a project of ${team.d.title}` }, planetsG);
      P.g._planet = P;
      P.body = svgEl('g', {}, P.g);
      P.atmo = svgEl('circle', { class: 'vy-atmo', r: P.r + 3, fill: 'none', stroke: mix(p.color, 255, 0.55) }, P.body);
      P.lit = svgEl('g', {}, P.body);
      svgEl('circle', { r: P.r, fill: `url(#${gid})` }, P.lit);
      if (p.d.people.length >= 3) {
        svgEl('ellipse', { rx: P.r * 1.85, ry: P.r * 0.42, fill: 'none', stroke: mix(p.color, 255, 0.35), 'stroke-width': 2.2, opacity: 0.7, transform: 'rotate(-18)' }, P.body);
      }
      P.moonsG = svgEl('g', {}, P.g);
      P.label = svgEl('text', { class: 'vy-planet-label', 'text-anchor': 'middle', y: P.r + 17 }, P.g);
      P.label.textContent = p.d.title;
      S.planets.push(P);
    });

    // the star
    const starG = svgEl('g', { class: 'vy-sun', tabindex: '0', role: 'button', 'aria-label': `${team.d.title}, the star of this system` }, root);
    svgEl('circle', { r: 62 * 4, fill: `url(#vy-tint-${team.tint})`, opacity: 0.32 }, starG);
    S.star = drawStar(starG, 62, team.tint, Math.min(12, team.bars + 2));
    S.starG = starG;
    const sl = svgEl('text', { class: 'vy-sun-label', 'text-anchor': 'middle', y: 62 * 2.2 + 18 }, starG);
    const gk = svgEl('tspan', { class: 'vy-greek' }, sl);
    gk.textContent = `${team.greek}  `;
    sl.appendChild(document.createTextNode(team.d.title));
    S.sunLabel = sl;

    // people: a moon on every planet they work on (gold-ringed if they're also somewhere else);
    // star-level members circle close as satellites, unless they also belong to another team,
    // in which case they're a comet whose orbit reaches out toward that team's star.
    const peopleG = svgEl('g', {}, root);
    let cometN = 0;
    people.forEach((person) => {
      const here = person.places.filter((w) => w.team === team);
      if (!here.length) return;
      const away = person.places.find((w) => w.team !== team);
      const linked = person.places.length > 1;
      for (const w of here.filter((x) => x.planet)) {
        const P = S.planets.find((q) => q.p === w.planet);
        const k = P.moonsG.childElementCount;
        const other = person.places.find((x) => x !== w);
        const M = { person, P, orbit: P.r + 10 + k * 7, a0: (k * TAU) / 3 + rand(0, 1), w: rand(0.35, 0.6) * (k % 2 ? -1 : 1) };
        M.g = svgEl('g', { class: `vy-moon${linked ? ' is-linked' : ''}`, 'data-person': person.name }, P.moonsG);
        if (linked) {
          M.g._go = other;
          M.g.setAttribute('tabindex', '-1');
          M.g.setAttribute('role', 'button');
          M.g.setAttribute('aria-label', `${person.name}, also in ${circleTitle(other)}`);
          svgEl('circle', { r: 5.5, fill: 'url(#vy-tint-gold)' }, M.g);
        }
        svgEl('circle', { r: 2.6, fill: '#F3E3C8' }, M.g);
        M.label = svgEl('text', { class: 'vy-moon-label', y: -6, 'text-anchor': 'middle' }, M.g);
        M.label.textContent = person.name;
        S.satellites.push(M);
      }
      if (!here.some((x) => !x.planet)) return;
      if (away) {
        const psi = dirTo(away.team.x, away.team.y); // aphelion points at their other team
        const rp = 95 + (cometN % 3) * 18, ra = 450;
        const C = {
          person, away,
          phi: psi + Math.PI,
          e: (ra - rp) / (ra + rp),
          p: (2 * ra * rp) / (ra + rp),
          th: psi + Math.PI + (cometN % 2 ? 1.1 : -1.1) + cometN * 0.4,
          h: 0,
        };
        cometN++;
        const a = (ra + rp) / 2, b = a * Math.sqrt(1 - C.e ** 2);
        C.h = (TAU * a * b) / rand(24, 34);
        C.g = svgEl('g', { class: 'vy-comet', tabindex: '0', role: 'button', 'aria-label': `${person.name}, also in ${circleTitle(away)}. Follow them there.` }, peopleG);
        C.g._comet = C;
        C.tails = [0.18, 0.35, 0.6].map((o, k) => svgEl('line', { class: 'vy-comet-tail', 'stroke-width': 5 - k * 1.6, opacity: o }, C.g));
        svgEl('circle', { r: 7, fill: 'url(#vy-tint-white)' }, C.g);
        svgEl('circle', { r: 2.6, fill: '#FFFFFF' }, C.g);
        C.label = svgEl('text', { class: 'vy-person-label', y: -10, 'text-anchor': 'middle' }, C.g);
        C.label.textContent = person.name;
        S.comets.push(C);
      } else {
        const k = S.satellites.filter((m) => !m.P).length;
        const M = { person, orbit: 104 + (k % 2) * 16, a0: (k * TAU) / 5, w: -0.12 };
        M.g = svgEl('g', { class: 'vy-satellite', 'data-person': person.name }, peopleG);
        svgEl('circle', { r: 3, fill: tint.hot }, M.g);
        M.label = svgEl('text', { class: 'vy-person-label', y: -8, 'text-anchor': 'middle' }, M.g);
        M.label.textContent = person.name;
        S.satellites.push(M);
      }
    });

    // the system's own slow life
    gsap.to(S.star.rays, { rotation: 360, svgOrigin: '0 0', duration: reduce ? 0 : 140, repeat: -1, ease: 'none' });
    if (!reduce) gsap.to(S.star.glow, { scale: 1.1, svgOrigin: '0 0', duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    lastSysT = sysClock.t;
    sys.S = S;
    sys.team = team;
    sys.focus = null;
    return S;
  };

  const placeSystem = () => {
    const S = sys.S;
    if (!S) return;
    const t = sysClock.t;
    const dt = t - lastSysT;
    lastSysT = t;
    for (const P of S.planets) {
      const a = P.a0 + (TAU * t) / P.period - (1 - P.appear) * 2;
      P.x = Math.cos(a) * P.orbit;
      P.y = Math.sin(a) * P.orbit;
      P.a = a;
    }
    for (const M of S.satellites) {
      const a = M.a0 + M.w * t;
      const cx = M.P ? M.P.x : 0, cy = M.P ? M.P.y : 0;
      M.x = cx + Math.cos(a) * M.orbit;
      M.y = cy + Math.sin(a) * M.orbit;
    }
    for (const C of S.comets) {
      // Kepler-ish: sweep fast near the star, slow and far out by the other team's star.
      const r = C.p / (1 + C.e * Math.cos(C.th - C.phi));
      C.th += (C.h / (r * r)) * dt;
      const r2 = C.p / (1 + C.e * Math.cos(C.th - C.phi));
      C.x = Math.cos(C.th) * r2;
      C.y = Math.sin(C.th) * r2;
      C.r = r2;
    }
  };

  const renderSystem = () => {
    const S = sys.S;
    if (!S) return;
    // follow a moving planet
    if (sys.focus) {
      const T = targetFor(sys.focus);
      const e = sys.fly;
      const c = sys.cam, f = sys.from;
      c.x = f.x + (T.x - f.x) * e;
      c.y = f.y + (T.y - f.y) * e;
      c.k = f.k * (T.k / f.k) ** e;
    } else if (sys.from && sys.fly < 1) {
      const T = systemHome();
      const e = sys.fly, c = sys.cam, f = sys.from;
      c.x = f.x + (T.x - f.x) * e;
      c.y = f.y + (T.y - f.y) * e;
      c.k = f.k * (T.k / f.k) ** e;
    }
    const c = sys.cam;
    sysLayer.setAttribute('transform', `scale(${c.k}) translate(${-c.x},${-c.y})`);
    for (const P of S.planets) {
      P.g.setAttribute('transform', `translate(${P.x},${P.y})`);
      P.body.setAttribute('transform', `scale(${P.hover * P.appear})`);
      // turn the lit face toward the star
      P.lit.setAttribute('transform', `rotate(${deg(P.a)})`); // gradient's bright side is -x; this aims it at the star
    }
    for (const M of S.satellites) {
      const ox = M.P ? M.P.x : 0, oy = M.P ? M.P.y : 0;
      M.g.setAttribute('transform', M.P ? `translate(${M.x - ox},${M.y - oy})` : `translate(${M.x},${M.y})`);
    }
    for (const C of S.comets) {
      C.g.setAttribute('transform', `translate(${C.x},${C.y})`);
      const len = gsap.utils.clamp(10, 70, 9000 / C.r);
      const ux = C.x / C.r, uy = C.y / C.r;
      C.tails.forEach((line, k) => {
        const l = len * (1 - k * 0.3);
        line.setAttribute('x2', ux * l);
        line.setAttribute('y2', uy * l);
      });
    }
  };

  const systemHome = () => fit(0, 0, 480, true);
  const targetFor = (P) => {
    const moons = P.moonsG.childElementCount;
    return fit(P.x, P.y, P.r * 2.6 + 30 + moons * 6, true);
  };

  // ---------------------------------------------------------------- warp effects
  const streaks = Array.from({ length: 90 }, () => {
    const g = svgEl('g', { transform: `rotate(${rand(0, 360)})` }, warpLayer);
    const line = svgEl('line', { class: 'vy-streak', x1: 0, y1: 0, x2: 0, y2: -rand(20, 60) }, g);
    return line;
  });
  gsap.set(streaks, { opacity: 0 });
  const warp = (color, inward = false) => {
    if (reduce) return gsap.timeline();
    const tl = gsap.timeline();
    streaks.forEach((s) => s.setAttribute('stroke', Math.random() < 0.5 ? '#FFF6E8' : color));
    tl.fromTo(streaks,
      { y: () => (inward ? -rand(500, 760) : -rand(10, 180)), scaleY: 0.3, opacity: 0 },
      {
        y: () => (inward ? -rand(0, 60) : -rand(560, 820)),
        scaleY: () => rand(2, 5),
        opacity: 0.9,
        svgOrigin: '0 0',
        duration: 0.9,
        ease: inward ? 'power2.out' : 'power2.in',
        stagger: { each: 0.006, from: 'random' },
      })
      .to(streaks, { opacity: 0, duration: 0.3 }, '-=0.25');
    return tl;
  };
  const flashTo = (color, peak = 0.85) => {
    if (reduce) return gsap.timeline();
    flash.style.setProperty('--flash', color);
    return gsap.timeline().to(flash, { opacity: peak, duration: 0.18, ease: 'power2.in' }).to(flash, { opacity: 0, duration: 0.7, ease: 'power2.out' });
  };

  // ---------------------------------------------------------------- navigation
  const state = { scene: 'sky', team: null, planet: null };
  let busy = false;
  let pending = null; // a destination asked for mid-flight, taken on arrival
  const done = () => {
    busy = false;
    if (pending) {
      const t = pending;
      pending = null;
      go(t);
    }
  };

  const arriveIn = (team, tl, at) => {
    // Build the destination, then zoom it up out of a point of light.
    tl.add(() => {
      buildSystem(team);
      gsap.set(sysLayer, { autoAlpha: 1 });
      openPanel({ team });
      const home = systemHome();
      Object.assign(sys.cam, { ...home, k: home.k * 0.12 });
      sys.from = { ...sys.cam };
      sys.fly = 0;
      sys.focus = null;
      for (const P of sys.S.planets) P.appear = 0;
      gsap.to(sys, { fly: 1, duration: reduce ? 0 : 1.5, ease: 'power3.out' });
      gsap.to(sys.S.planets, { appear: 1, duration: reduce ? 0 : 1.2, stagger: 0.12, ease: 'back.out(1.6)', delay: 0.3 });
      if (!reduce) {
        gsap.from(sys.S.root.querySelectorAll('.vy-sys-orbit'), { drawSVG: '0%', duration: 1.4, stagger: 0.1, ease: 'power2.inOut', delay: 0.2 });
        gsap.fromTo(sys.S.root.querySelectorAll('.vy-beacon'), { opacity: 0 }, { opacity: 0.85, duration: 1, stagger: 0.05, delay: 0.9 });
        gsap.from(sys.S.root.querySelectorAll('.vy-comet, .vy-satellite'), { opacity: 0, duration: 0.8, delay: 1.1 });
      }
    }, at);
    tl.add(() => {
      state.scene = 'system';
      state.team = team;
      state.planet = null;
      renderCrumbs();
    }, at);
  };

  const voyageTo = (team, planet) => {
    if (busy) return;
    busy = true;
    hideTip();
    closePanel();
    const tl = gsap.timeline({
      onComplete: () => {
        busy = false;
        if (planet && !pending) focusPlanet(sys.S.planets.find((P) => P.p === planet));
        done();
      },
    });
    gsap.to(hero, { autoAlpha: 0, y: -10, duration: 0.4 });
    gsap.to(skyTween, { timeScale: 0, duration: 0.4 });
    if (state.scene === 'sky') {
      // dive at the star
      placeSky();
      // turn toward the star first, then plunge in
      tl.to(sky.cam, { x: team.x, y: team.y, duration: reduce ? 0 : 0.7, ease: 'power2.inOut' }, 0)
        .to(sky.cam, { k: 16, duration: reduce ? 0 : 1.25, ease: 'expo.in' }, 0)
        .to(bgLayer, { scale: 2.4, svgOrigin: '0 0', duration: reduce ? 0 : 1.25, ease: 'power3.in' }, 0)
        .add(warp(TINT[team.tint].mid), reduce ? 0 : 0.35)
        .add(flashTo(TINT[team.tint].core), reduce ? 0 : 1.05)
        .set(skyLayer, { autoAlpha: 0 }, reduce ? 0 : 1.2)
        .to(bgLayer, { scale: 1, svgOrigin: '0 0', duration: reduce ? 0 : 1.4, ease: 'power3.out' }, reduce ? 0 : 1.2);
      arriveIn(team, tl, reduce ? 0 : 1.2);
    } else {
      // hop: fly toward the other star on the horizon, then drop into its system
      const beacon = sys.S.horizon.find((h) => h.target.team === team);
      const bx = Math.cos(beacon.angle) * 455, by = Math.sin(beacon.angle) * 455;
      sys.focus = null;
      sys.fly = 1;
      sys.from = null;
      tl.to(sys.cam, { x: bx, y: by, k: sys.cam.k * 9, duration: reduce ? 0 : 1.2, ease: 'power3.in' }, 0)
        .to(bgLayer, { scale: 2.4, svgOrigin: '0 0', duration: reduce ? 0 : 1.2, ease: 'power3.in' }, 0)
        .add(warp(TINT[team.tint].mid), reduce ? 0 : 0.3)
        .add(flashTo(TINT[team.tint].core), reduce ? 0 : 1)
        .to(bgLayer, { scale: 1, svgOrigin: '0 0', duration: reduce ? 0 : 1.4, ease: 'power3.out' }, reduce ? 0 : 1.15);
      arriveIn(team, tl, reduce ? 0 : 1.15);
    }
    return tl;
  };

  const backToSky = () => {
    if (busy || state.scene === 'sky') return;
    busy = true;
    hideTip();
    closePanel();
    const team = state.team;
    const tl = gsap.timeline({ onComplete: done });
    sys.focus = null;
    sys.from = null;
    sys.fly = 1;
    tl.to(sys.cam, { k: sys.cam.k * 0.08, duration: reduce ? 0 : 0.9, ease: 'power3.in' }, 0)
      .to(sysLayer, { autoAlpha: 0, duration: reduce ? 0 : 0.35 }, reduce ? 0 : 0.6)
      .to(bgLayer, { scale: 0.6, svgOrigin: '0 0', duration: reduce ? 0 : 0.9, ease: 'power3.in' }, 0)
      .add(warp(TINT[team.tint].mid, true), 0)
      .add(flashTo(TINT[team.tint].core, 0.45), reduce ? 0 : 0.8)
      .add(() => {
        placeSky();
        Object.assign(sky.cam, { x: team.x, y: team.y, k: 16 });
        gsap.set(skyLayer, { autoAlpha: 1 });
        gsap.to(sky.cam, { ...skyHome(), duration: reduce ? 0 : 1.5, ease: 'power3.out' });
        gsap.to(skyTween, { timeScale: reduce ? 0 : 1, duration: 1.5, delay: 0.6 });
        gsap.to(hero, { autoAlpha: 1, y: 0, duration: 0.6, delay: 0.9 });
        state.scene = 'sky';
        state.team = null;
        state.planet = null;
        renderCrumbs();
      }, reduce ? 0 : 0.9)
      .to(bgLayer, { scale: 1, svgOrigin: '0 0', duration: reduce ? 0 : 1.2, ease: 'power3.out' }, reduce ? 0 : 0.9);
    return tl;
  };

  const focusPlanet = (P) => {
    if (busy) return;
    hideTip();
    sys.from = { ...sys.cam };
    sys.fly = 0;
    sys.focus = P;
    state.planet = P.p;
    gsap.to(sys, { fly: 1, duration: reduce ? 0 : 1.3, ease: 'power3.inOut' });
    gsap.to(sysTween, { timeScale: reduce ? 0 : 0.15, duration: 1 });
    gsap.to(sys.S.sunLabel, { opacity: 0, duration: 0.4 });
    for (const Q of sys.S.planets) {
      gsap.to(Q.g, { opacity: Q === P ? 1 : 0.35, duration: 0.6 });
      Q.g.classList.toggle('is-focus', Q === P);
    }
    openPanel({ team: state.team, planet: P.p });
    renderCrumbs();
  };

  const unfocusPlanet = () => {
    if (!sys.focus) return;
    sys.from = { ...sys.cam };
    sys.focus = null;
    sys.fly = 0;
    state.planet = null;
    gsap.to(sys, { fly: 1, duration: reduce ? 0 : 1.1, ease: 'power3.inOut' });
    gsap.to(sysTween, { timeScale: reduce ? 0 : 1, duration: 1 });
    gsap.to(sys.S.sunLabel, { opacity: 1, duration: 0.6, delay: 0.4 });
    for (const Q of sys.S.planets) {
      gsap.to(Q.g, { opacity: 1, duration: 0.6 });
      Q.g.classList.remove('is-focus');
    }
    openPanel({ team: state.team });
    renderCrumbs();
  };

  // One entry point for chips, search results, comets and beacons.
  const go = (target) => {
    if (busy) return void (pending = target);
    if (!target || target.sky) {
      if (state.scene === 'system') backToSky();
      return;
    }
    const { team, planet } = target;
    if (state.scene === 'sky' || state.team !== team) {
      voyageTo(team, planet);
      return;
    }
    if (planet) focusPlanet(sys.S.planets.find((P) => P.p === planet));
    else unfocusPlanet();
  };

  const stepBack = () => {
    if (state.planet) unfocusPlanet();
    else if (state.scene === 'system') backToSky();
  };

  // ---------------------------------------------------------------- crumbs + panel
  const renderCrumbs = () => {
    stage.dataset.scene = state.scene;
    const items = [['The sky', { sky: true }]];
    if (state.team) items.push([state.team.d.title, { team: state.team }]);
    if (state.planet) items.push([state.planet.d.title, { team: state.team, planet: state.planet }]);
    crumbs.replaceChildren();
    items.forEach(([label, target], i) => {
      if (i) crumbs.append(Object.assign(document.createElement('span'), { className: 'vy-sep', textContent: '›' }));
      const b = Object.assign(document.createElement('button'), { type: 'button', textContent: label });
      if (i === items.length - 1) b.setAttribute('aria-current', 'true');
      on(b, 'click', () => go(target));
      crumbs.append(b);
    });
    crumbs.hidden = items.length === 1;
  };

  let panelOpen = false;
  let split;
  const chip = (label, target, extra = '') => {
    const b = Object.assign(document.createElement('button'), { type: 'button', className: `vy-chip ${extra}`, textContent: label });
    on(b, 'click', () => go(target));
    return b;
  };
  const openPanel = ({ team, planet }) => {
    const d = planet ? planet.d : team.d;
    panel.querySelector('.vy-kicker').textContent = planet ? `A PLANET OF ${team.d.title.toUpperCase()}` : `${team.greek} · STAR SYSTEM`;
    const title = panel.querySelector('.vy-title');
    split?.revert();
    title.textContent = d.title;
    const count = planet ? d.people.length : team.members;
    panel.querySelector('.vy-count').textContent = `${count} ${count === 1 ? 'person' : 'people'}${planet ? '' : ` · ${team.planets.length} ${team.planets.length === 1 ? 'planet' : 'planets'}`}`;
    const goal = panel.querySelector('.vy-goal');
    goal.innerHTML = d.goalHtml;
    goal.hidden = !d.goalHtml;
    const desc = panel.querySelector('.vy-desc');
    desc.innerHTML = d.descriptionHtml;
    desc.hidden = !d.descriptionHtml;

    const kids = panel.querySelector('.vy-kids');
    kids.replaceChildren(...(planet ? [] : team.planets.map((p) => chip(p.d.title, { team, planet: p }))));
    kids.parentElement.hidden = !kids.childElementCount;

    const list = panel.querySelector('.vy-people-list');
    const here = planet ? planet.id : team.id;
    list.replaceChildren(
      ...d.people.map((name) => {
        const p = people.find((q) => q.name === name);
        const li = document.createElement('li');
        li.append(Object.assign(document.createElement('span'), { className: 'vy-person', textContent: name }));
        const elsewhere = p.places.filter((w) => (w.planet ?? w.team).id !== here);
        if (elsewhere.length) {
          li.append(Object.assign(document.createElement('span'), { className: 'vy-also', textContent: 'also in' }));
          li.append(...elsewhere.map((w) => chip(circleTitle(w), w, 'is-small')));
        }
        return li;
      }),
    );
    list.parentElement.hidden = !d.people.length;

    const kw = panel.querySelector('.vy-keywords');
    kw.replaceChildren(...d.keywords.map((k) => Object.assign(document.createElement('span'), { textContent: k })));
    kw.hidden = !d.keywords.length;

    panel.scrollTop = 0;
    panel.setAttribute('aria-hidden', 'false');
    if (!panelOpen) gsap.fromTo(panel, { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: reduce ? 0 : 0.6, ease: 'power3.out', delay: reduce ? 0 : 0.3 });
    panelOpen = true;
    if (!reduce) {
      split = SplitText.create(title, { type: 'words,chars' });
      gsap.from(split.chars, { opacity: 0, y: 12, filter: 'blur(4px)', stagger: 0.02, duration: 0.5, ease: 'power2.out', delay: 0.35 });
    }
  };
  const closePanel = () => {
    if (!panelOpen) return;
    panelOpen = false;
    panel.setAttribute('aria-hidden', 'true');
    gsap.to(panel, { autoAlpha: 0, x: 24, duration: reduce ? 0 : 0.3 });
  };
  gsap.set([panel, tip, flash], { autoAlpha: 0 });
  gsap.set(flash, { visibility: 'visible', opacity: 0 });
  on(panel.querySelector('.vy-close'), 'click', stepBack);

  // ---------------------------------------------------------------- hover + tips
  const tipX = gsap.quickTo(tip, 'x', { duration: 0.2, ease: 'power3' });
  const tipY = gsap.quickTo(tip, 'y', { duration: 0.2, ease: 'power3' });
  const moveTip = (e) => {
    const r = stage.getBoundingClientRect();
    tipX(e.clientX - r.left + 16);
    tipY(e.clientY - r.top + 14);
  };
  const showTip = (html, e) => {
    tip.innerHTML = html;
    moveTip(e);
    gsap.to(tip, { autoAlpha: 1, duration: 0.15 });
  };
  const hideTip = () => gsap.to(tip, { autoAlpha: 0, duration: 0.15 });
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  let hoverTeam = null;
  const skyHover = (t, e) => {
    if (t === hoverTeam) return;
    hoverTeam = t;
    for (const o of teams) {
      gsap.to(o, { hover: o === t ? 1.3 : 1, duration: 0.5, ease: o === t ? 'back.out(3)' : 'power2.out' });
      gsap.to(o.g, { opacity: !t || o === t || links.some((l) => (l.a === t && l.b === o) || (l.b === t && l.a === o)) ? 1 : 0.3, duration: 0.4 });
      o.spoke.classList.toggle('is-hot', o === t);
    }
    for (const l of links) l.el.classList.toggle('is-hot', !!t && (l.a === t || l.b === t));
    gsap.to(skyTween, { timeScale: t || reduce ? 0 : 1, duration: 0.6 });
    if (t) {
      const shared = links.filter((l) => l.a === t || l.b === t);
      showTip(
        `<strong>${t.greek} ${esc(t.d.title)}</strong><span>${t.members} people · ${t.planets.length} planets</span>` +
        (shared.length ? `<span class="vy-tip-links">linked to ${shared.map((l) => esc((l.a === t ? l.b : l.a).d.title)).join(', ')}</span>` : '') +
        '<em>Click to travel there</em>', e);
    } else hideTip();
  };

  on(svg, 'pointermove', (e) => {
    moveTip(e);
    if (busy) return;
    if (state.scene === 'sky') {
      const tEl = e.target.closest?.('.vy-team');
      skyHover(tEl ? teamById.get(tEl.dataset.team) : null, e);
      return;
    }
    const pl = e.target.closest?.('.vy-planet');
    const co = e.target.closest?.('.vy-comet');
    const be = e.target.closest?.('.vy-beacon');
    const pe = e.target.closest?.('[data-person]');
    for (const P of sys.S.planets) {
      const hot = pl?._planet === P && sys.focus !== P;
      gsap.to(P, { hover: hot ? 1.18 : 1, duration: 0.4, overwrite: 'auto' });
    }
    if (co) {
      const C = co._comet;
      showTip(`<strong>${esc(C.person.name)}</strong><span>also in ${esc(circleTitle(C.away))}</span><em>Click to follow them there</em>`, e);
    } else if (be) {
      showTip(be._target.sky ? '<strong>ecoPTO</strong><em>Back out to the whole sky</em>' : `<strong>${esc(be._target.team.d.title)}</strong><em>Travel there</em>`, e);
    } else if (pl && sys.focus !== pl._planet) {
      const P = pl._planet;
      showTip(`<strong>${esc(P.p.d.title)}</strong><span>${P.p.d.people.length} people</span><em>Click to visit</em>`, e);
    } else if (pe && pe._go) {
      showTip(`<strong>${esc(pe.dataset.person)}</strong><span>also in ${esc(circleTitle(pe._go))}</span><em>Click to follow them there</em>`, e);
    } else if (pe) {
      showTip(`<strong>${esc(pe.dataset.person)}</strong>`, e);
    } else hideTip();
  });
  on(svg, 'pointerleave', () => {
    if (state.scene === 'sky') skyHover(null);
    hideTip();
  });

  const activate = (el) => {
    if (busy) return;
    if (state.scene === 'sky') {
      const tEl = el.closest?.('.vy-team');
      if (tEl) {
        skyHover(null);
        voyageTo(teamById.get(tEl.dataset.team));
      }
      return;
    }
    const lm0 = el.closest?.('.vy-moon.is-linked');
    const pl = el.closest?.('.vy-planet');
    if (pl && !(lm0 && sys.focus === pl._planet)) return sys.focus === pl._planet ? unfocusPlanet() : focusPlanet(pl._planet);
    const co = el.closest?.('.vy-comet');
    if (co) return go(co._comet.away);
    const lm = el.closest?.('.vy-moon.is-linked');
    if (lm && sys.focus === lm.closest('.vy-planet')?._planet) return go(lm._go);
    const be = el.closest?.('.vy-beacon');
    if (be) return go(be._target);
    if (el.closest?.('.vy-sun')) return unfocusPlanet();
    stepBack();
  };
  on(svg, 'click', (e) => activate(e.target));
  on(svg, 'keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activate(e.target);
    }
  });
  on(document, 'keydown', (e) => {
    if (e.key === 'Escape' && !e.target.closest?.('.vy-search')) stepBack();
  });

  // ---------------------------------------------------------------- search
  const searchables = [
    ...teams.map((t) => ({ label: t.d.title, sub: 'Star', d: t.d, target: { team: t } })),
    ...teams.flatMap((t) => t.planets.map((p) => ({ label: p.d.title, sub: `Planet of ${t.d.title}`, d: p.d, target: { team: t, planet: p } }))),
  ];
  on(search, 'input', () => {
    const q = search.value.trim().toLowerCase();
    const hits = q
      ? searchables.filter((s) => [s.label, s.d.goalHtml, ...s.d.keywords, ...s.d.people].some((v) => v.toLowerCase().includes(q)))
      : [];
    results.replaceChildren(...hits.slice(0, 8).map((h) => {
      const b = chip(h.label, h.target);
      b.title = h.sub;
      return b;
    }));
    if (q && !hits.length) results.textContent = 'Nothing in this sky matches yet.';
    if (state.scene === 'sky') {
      for (const t of teams) {
        const lit = !q || hits.some((h) => h.target.team === t);
        gsap.to(t.g, { opacity: lit ? 1 : 0.15, duration: 0.4 });
      }
    }
  });
  on(search, 'keydown', (e) => {
    if (e.key === 'Enter') results.querySelector('button')?.click();
    if (e.key === 'Escape') {
      search.value = '';
      search.dispatchEvent(new Event('input'));
    }
  });

  // ---------------------------------------------------------------- run
  const skyHome = () => ({ ...fit(0, 0, 440, false) });
  const render = () => {
    if (state.scene === 'sky' || busy) placeSky();
    renderSky();
    placeSystem();
    renderSystem();
  };

  let firstResize = true; // the observer fires once on attach; the intro owns the camera then
  const ro = new ResizeObserver(() => {
    if (firstResize) return void (firstResize = false);
    if (busy) return;
    if (state.scene === 'sky') Object.assign(sky.cam, skyHome());
    else if (!sys.focus) Object.assign(sys.cam, systemHome());
  });

  const ctx = gsap.context(() => {
    gsap.ticker.add(render);
    ro.observe(svg);
    Object.assign(sky.cam, skyHome());
    gsap.set(sysLayer, { autoAlpha: 0 });
    spokeLayer.querySelectorAll('line').forEach((l) => { l.setAttribute('x1', 0); l.setAttribute('y1', 0); });
    renderCrumbs();

    if (reduce) {
      skyTween.timeScale(0);
      sysTween.timeScale(0);
      return;
    }

    // twinkling
    bgStars.filter(() => Math.random() < 0.3).forEach((s) => {
      gsap.to(s, { opacity: rand(0.05, 0.25), duration: rand(0.8, 2.4), repeat: -1, yoyo: true, ease: 'sine.inOut', delay: rand(0, 3) });
    });
    gsap.to(galaxy, { rotation: 360, svgOrigin: '0 0', duration: 240, repeat: -1, ease: 'none' });
    for (const t of teams) {
      gsap.to(t.star.rays, { rotation: 360, svgOrigin: '0 0', duration: rand(80, 140), repeat: -1, ease: 'none' });
      gsap.to(t.star.glow, { opacity: 0.45, scale: 0.9, svgOrigin: '0 0', duration: rand(1.2, 2.4), repeat: -1, yoyo: true, ease: 'sine.inOut', delay: rand(0, 2) });
    }

    // arrival: the sky switches on
    const intro = gsap.timeline();
    const start = skyHome();
    Object.assign(sky.cam, { ...start, k: start.k * 0.55 });
    intro
      .to(sky.cam, { k: start.k, duration: 2.6, ease: 'power3.out' }, 0)
      .from(bgStars, { opacity: 0, duration: 1.2, stagger: { each: 0.004, from: 'random' } }, 0)
      .from(galaxy, { scale: 0, svgOrigin: '0 0', duration: 1.6, ease: 'power3.out' }, 0.2)
      .from(skyOrbits.children, { drawSVG: '0%', duration: 1.6, stagger: 0.12, ease: 'power2.inOut' }, 0.4)
      .from(teams.map((t) => t.star.g), { scale: 0, svgOrigin: '0 0', duration: 0.9, stagger: 0.15, ease: 'back.out(2)' }, 0.8)
      .from(teams.map((t) => t.label), { opacity: 0, duration: 0.8, stagger: 0.15 }, 1.1)
      .from([spokeLayer, linkLayer], { opacity: 0, duration: 1 }, 1.6);
    if (hero) {
      const h = SplitText.create(hero.querySelector('h1'), { type: 'chars' });
      intro.from(h.chars, { opacity: 0, y: 16, filter: 'blur(6px)', stagger: 0.04, duration: 0.8, ease: 'power2.out' }, 0.5)
        .from(hero.querySelector('p'), { opacity: 0, y: 8, duration: 0.8 }, 1.2);
    }
    on(stage, 'pointerdown', () => intro.progress(1), { once: true });
  }, stage);

  return () => {
    abort.abort();
    ro.disconnect();
    gsap.ticker.remove(render);
    split?.revert();
    ctx.revert();
    skyTween.kill();
    sysTween.kill();
    gsap.killTweensOf([sky.cam, sys, sys.cam, bgLayer, flash]);
    for (const l of [bgLayer, skyLayer, sysLayer, warpLayer]) l.remove();
    defs.replaceChildren();
  };
}
