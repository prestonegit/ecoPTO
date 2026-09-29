// The circles world: ecoPTO as a small, friendly star system.
//
//   sun     = the general circle (ecoPTO)
//   planets = teams, sharing orbits around the sun
//   moons   = sub-circles, orbiting their team
//   dots    = people. Most circle their own team; people in more than one circle travel
//             between them (sociocracy's "double links").
//
// Positions are computed each frame from a single orbit clock. GSAP drives that clock and every
// other number that changes over time (camera, hover, intro, travellers); a ticker callback turns
// the state into SVG transforms.

import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(DrawSVGPlugin, SplitText);

const NS = 'http://www.w3.org/2000/svg';
const TAU = Math.PI * 2;
const PALETTE = ['#B05B3B', '#5F9A70', '#D4962F', '#5A8DB8', '#9B6597', '#C9704F', '#7D8B45'];
const PERSON = '#F4AE85';

const svgEl = (tag, attrs = {}, parent) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (parent) parent.appendChild(el);
  return el;
};

const wrap = (text, max = 11) => {
  const lines = [];
  for (const word of text.split(/\s+/)) {
    const last = lines[lines.length - 1];
    if (last && (last + ' ' + word).length <= max) lines[lines.length - 1] = last + ' ' + word;
    else lines.push(word);
  }
  return lines;
};

// Mix a hex colour toward white.
const tint = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * amt));
  return `rgb(${c.join(',')})`;
};

const addLabel = (parent, text, { size, max, y = 0, cls }) => {
  const lines = wrap(text, max);
  const el = svgEl('text', { class: cls, 'font-size': size, 'text-anchor': 'middle' }, parent);
  lines.forEach((l, i) => {
    const t = svgEl('tspan', { x: 0, y: y + (i - (lines.length - 1) / 2) * size * 1.12 + size * 0.35 }, el);
    t.textContent = l;
  });
  return el;
};

export function mountWorld(stage, data) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const abort = new AbortController();
  const on = (el, type, fn, opts = {}) => el.addEventListener(type, fn, { ...opts, signal: abort.signal });

  const svg = stage.querySelector('.cw-svg');
  const camera = svg.querySelector('.cw-camera');
  const L = Object.fromEntries(
    ['rings', 'threads', 'planets', 'moons', 'people'].map((k) => [k, svgEl('g', { class: `cw-${k}` }, camera)]),
  );
  const crumbs = stage.querySelector('.cw-crumbs');
  const panel = stage.querySelector('.cw-panel');
  const tip = stage.querySelector('.cw-tip');
  const search = stage.querySelector('.cw-search input');
  const results = stage.querySelector('.cw-results');
  const hero = stage.querySelector('.cw-hero');

  // ---------------------------------------------------------------- model
  const base = (d, extra) => ({ data: d, x: 0, y: 0, hover: 1, bump: 0, appear: 1, children: [], ...extra });
  const sun = base(data.root, { kind: 'sun', depth: 0, parent: null, r: 64, color: '#EE7A2E' });
  const planets = data.root.children.map((d, i) =>
    base(d, {
      kind: 'planet',
      depth: 1,
      parent: sun,
      color: d.color ?? PALETTE[i % PALETTE.length],
      r: 46 + Math.min(12, d.people.length * 1.6 + d.children.length * 1.5),
    }),
  );
  sun.children = planets;
  const moons = [];
  for (const p of planets) {
    p.children = p.data.children.map((d, j, all) => {
      const m = base(d, {
        kind: 'moon',
        depth: 2,
        parent: p,
        color: tint(p.color, 0.3),
        r: 13 + Math.min(6, d.people.length * 1.8),
        a0: (j / all.length) * TAU + 0.4,
      });
      moons.push(m);
      return m;
    });
    const maxMoon = Math.max(0, ...p.children.map((m) => m.r));
    p.residentOrbit = p.r + 11;
    p.moonOrbit = p.r + 34;
    p.extent = p.moonOrbit + maxMoon + 8;
  }
  const nodes = [sun, ...planets, ...moons];
  const byId = new Map(nodes.map((n) => [n.data.id, n]));

  // Fill orbits outward, as many planets per orbit as fit without their moons ever touching.
  // Everything on one orbit turns together, so neighbours can never collide.
  const maxExtent = Math.max(...planets.map((p) => p.extent));
  const orbits = [];
  let radius = sun.r + maxExtent + 70;
  for (let i = 0; i < planets.length; ) {
    const fits = Math.max(1, Math.floor((TAU * radius) / (2 * maxExtent + 40)));
    const group = planets.slice(i, i + fits);
    const period = 150 * (radius / 250) ** 1.5; // seconds per lap, slower further out
    group.forEach((p, j) => Object.assign(p, { R: radius, a0: (j / group.length) * TAU - Math.PI / 2 + orbits.length * 0.6, period }));
    orbits.push(radius);
    i += group.length;
    radius += 2 * maxExtent + 40;
  }
  sun.extent = orbits[orbits.length - 1] + maxExtent;

  // ---------------------------------------------------------------- people
  const people = data.people.map((p, i) => ({ ...p, index: i, nodes: p.circles.map((id) => byId.get(id)).filter(Boolean) }));
  const residents = people.filter((p) => p.nodes.length === 1);
  const travellers = people.filter((p) => p.nodes.length > 1);
  for (const n of nodes) n.residents = residents.filter((p) => p.nodes[0] === n);
  for (const n of nodes) n.residents.forEach((p, j, all) => Object.assign(p, { host: n, a0: (j / all.length) * TAU }));

  // ---------------------------------------------------------------- build svg
  const defs = svg.querySelector('defs');
  for (const r of orbits) svgEl('circle', { class: 'cw-orbit', r }, L.rings);

  const sunG = svgEl('g', { class: 'cw-sun' }, L.planets);
  sun.el = { g: sunG };
  sun.el.glow = [0, 1, 2].map(() => svgEl('circle', { class: 'cw-sun-glow', r: sun.r }, sunG));
  sun.el.body = svgEl('g', { class: 'cw-body', 'data-id': sun.data.id }, sunG);
  sun.el.shape = svgEl('circle', { class: 'cw-shape', r: sun.r, fill: 'url(#cw-sun-fill)' }, sun.el.body);
  sun.el.label = addLabel(sun.el.body, sun.data.title, { size: 20, max: 12, cls: 'cw-label' });

  for (const n of [...planets, ...moons]) {
    const g = svgEl('g', { class: `cw-${n.kind}` }, n.kind === 'planet' ? L.planets : L.moons);
    n.el = { g };
    if (n.kind === 'planet' && n.children.length) {
      n.el.moonOrbit = svgEl('circle', { class: 'cw-moon-orbit', r: n.moonOrbit }, g);
    }
    const body = svgEl('g', {
      class: 'cw-body',
      'data-id': n.data.id,
      role: 'button',
      tabindex: '-1',
      'aria-label': `${n.data.title}${n.kind === 'moon' ? `, part of ${n.parent.data.title}` : ''}`,
    }, g);
    n.el.body = body;
    n.el.ring = svgEl('circle', { class: 'cw-ring', r: n.r + 5 }, body);
    n.el.shape = svgEl('circle', { class: 'cw-shape', r: n.r, fill: n.color }, body);
    if (n.kind === 'planet') {
      const longest = Math.max(...wrap(n.data.title).map((l) => l.length));
      n.el.label = addLabel(body, n.data.title, { size: Math.min(15, (1.65 * n.r) / (longest * 0.56)), max: 11, cls: 'cw-label' });
    } else {
      n.el.label = addLabel(g, n.data.title, { size: 6, max: 16, y: n.r + 8, cls: 'cw-moon-label' });
    }
  }

  for (const p of residents) {
    p.el = svgEl('g', { class: 'cw-person', 'data-person': p.name }, L.people);
    svgEl('circle', { r: p.host.kind === 'moon' ? 2.8 : 3.6, fill: PERSON }, p.el);
    p.label = svgEl('text', { class: 'cw-name', 'font-size': 4.6, 'text-anchor': 'middle', y: 9 }, p.el);
    p.label.textContent = p.name;
  }
  for (const p of travellers) {
    p.threads = p.nodes.map(() => svgEl('path', { class: 'cw-thread' }, L.threads));
    p.el = svgEl('g', { class: 'cw-person is-traveller', 'data-person': p.name }, L.people);
    svgEl('circle', { class: 'cw-traveller-halo', r: 7 }, p.el);
    svgEl('circle', { r: 4, fill: PERSON }, p.el);
    p.label = svgEl('text', { class: 'cw-name', 'font-size': 4.6, 'text-anchor': 'middle', y: 12 }, p.el);
    p.label.textContent = p.name;
    p.leg = 0;
    p.u = 0;
  }

  // ---------------------------------------------------------------- simulation
  const clock = { t: 0 };
  const orbitTween = gsap.to(clock, { t: 36000, duration: 36000, ease: 'none', repeat: -1 });
  let orbitSpeed = 1;
  const setOrbitSpeed = (v, d = 0.8) => gsap.to(orbitTween, { timeScale: reduce ? 0 : v, duration: d, overwrite: true });

  const legOf = (p, i) => {
    // Two circles: shuttle back and forth. More: go round the loop.
    const n = p.nodes.length;
    return n === 2 ? [p.nodes[i % 2], p.nodes[(i + 1) % 2]] : [p.nodes[i % n], p.nodes[(i + 1) % n]];
  };
  const curve = (A, B, bend) => {
    const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1;
    const ux = dx / d, uy = dy / d;
    const a = { x: A.x + ux * (A.r * A.hover + 6), y: A.y + uy * (A.r * A.hover + 6) };
    const b = { x: B.x - ux * (B.r * B.hover + 6), y: B.y - uy * (B.r * B.hover + 6) };
    const c = { x: (a.x + b.x) / 2 - uy * d * bend, y: (a.y + b.y) / 2 + ux * d * bend };
    return { a, b, c };
  };
  const onCurve = ({ a, b, c }, u) => ({
    x: (1 - u) ** 2 * a.x + 2 * (1 - u) * u * c.x + u * u * b.x,
    y: (1 - u) ** 2 * a.y + 2 * (1 - u) * u * c.y + u * u * b.y,
  });

  const place = () => {
    const t = clock.t;
    for (const p of planets) {
      const a = p.a0 + (TAU * t) / p.period - (1 - p.appear) * 1.4;
      p.x = Math.cos(a) * p.R;
      p.y = Math.sin(a) * p.R;
    }
    for (const m of moons) {
      const a = m.a0 + (TAU * t) / 55 - (1 - m.appear) * 2;
      m.x = m.parent.x + Math.cos(a) * m.parent.moonOrbit;
      m.y = m.parent.y + Math.sin(a) * m.parent.moonOrbit;
    }
    for (const p of residents) {
      const h = p.host;
      const r = h.kind === 'moon' ? h.r + 7 : h.residentOrbit;
      const a = p.a0 - (TAU * t) / 30;
      p.x = h.x + Math.cos(a) * r * h.hover;
      p.y = h.y + Math.sin(a) * r * h.hover;
    }
    for (const p of travellers) {
      const [A, B] = legOf(p, p.leg);
      const pt = onCurve(curve(A, B, p.index % 2 ? 0.22 : -0.22), p.u);
      p.x = pt.x;
      p.y = pt.y;
    }
  };

  // ---------------------------------------------------------------- camera
  const cam = { x: 0, y: 0, k: 1 };
  const fly = { u: 1, from: { ...cam } };
  let unitPx = 1;
  const measure = () => {
    const r = svg.getBoundingClientRect();
    unitPx = Math.min(r.width, r.height) / 1000;
    return r;
  };
  measure();

  let panelOpen = false;
  const target = (n) => {
    const r = measure();
    let availW = r.width, availH = r.height, offX = 0, offY = 0;
    if (panelOpen) {
      const pr = panel.getBoundingClientRect();
      if (r.width >= 900) { availW -= pr.width + 24; offX = -(pr.width + 24) / 2; }
      else { const h = Math.min(pr.height, r.height * 0.55); availH -= h; offY = -h / 2; }
    }
    // Leave room round the edge for moon labels and people's names.
    const extent = n.kind === 'moon' ? n.r * 8 : n.extent + (n.kind === 'planet' ? 22 : 0);
    const k = Math.min(availW, availH) / (2.2 * extent * unitPx);
    return { x: n.x - offX / (unitPx * k), y: n.y - offY / (unitPx * k), k };
  };

  let focus = sun;
  const flyTo = (instant) => {
    fly.from = { ...cam };
    gsap.killTweensOf(fly);
    if (instant || reduce) fly.u = 1;
    else {
      fly.u = 0;
      gsap.to(fly, { u: 1, duration: 1.3, ease: 'power3.inOut' });
    }
  };

  // ---------------------------------------------------------------- render
  let zoomIntro = null; // camera multiplier during the intro
  const render = () => {
    place();
    // The camera follows its target even while it drifts along its orbit.
    const T = target(focus);
    if (zoomIntro) T.k *= zoomIntro.m;
    const e = fly.u;
    cam.x = fly.from.x + (T.x - fly.from.x) * e;
    cam.y = fly.from.y + (T.y - fly.from.y) * e;
    cam.k = fly.from.k * (T.k / fly.from.k) ** e;
    if (e >= 1) Object.assign(cam, T);
    camera.setAttribute('transform', `translate(${-cam.x * cam.k},${-cam.y * cam.k}) scale(${cam.k})`);

    sun.el.body.setAttribute('transform', `scale(${sun.appear * sun.hover * (1 + sun.bump)})`);
    for (const n of [...planets, ...moons]) {
      n.el.g.setAttribute('transform', `translate(${n.x},${n.y})`);
      n.el.body.setAttribute('transform', `scale(${n.appear * n.hover * (1 + n.bump)})`);
      n.el.moonOrbit?.setAttribute('opacity', n.appear);
    }
    for (const p of residents) p.el.setAttribute('transform', `translate(${p.x},${p.y})`);
    for (const p of travellers) {
      p.el.setAttribute('transform', `translate(${p.x},${p.y})`);
      p.nodes.forEach((_, i) => {
        const { a, b, c } = curve(...legOf(p, i), p.index % 2 ? 0.22 : -0.22);
        p.threads[i].setAttribute('d', `M${a.x},${a.y} Q${c.x},${c.y} ${b.x},${b.y}`);
      });
    }
  };

  // ---------------------------------------------------------------- focus
  const family = (n) => new Set([n, ...n.children, ...(n.parent ? [n.parent] : []), ...(n.kind === 'moon' ? n.parent.children : [])]);

  const setFocus = (n, { instant = false } = {}) => {
    focus = n;
    if (n === sun) closePanel();
    else openPanel(n);
    flyTo(instant);
    setOrbitSpeed(n === sun ? 1 : 0.3);
    orbitSpeed = n === sun ? 1 : 0.3;

    const fam = family(n);
    for (const m of nodes) {
      const dim = n !== sun && !fam.has(m) && m !== sun;
      gsap.to(m.el.g, { opacity: dim ? 0.28 : 1, duration: 0.6, overwrite: 'auto' });
      if (m.kind === 'moon') {
        const show = m.parent === n || (n.kind === 'moon' && m.parent === n.parent);
        gsap.to(m.el.label, { opacity: show ? 1 : 0, duration: 0.5, delay: show ? 0.4 : 0, overwrite: true });
      }
      if (m !== sun) m.el.body.setAttribute('tabindex', m.parent === n || (n.kind === 'moon' && m.parent === n.parent) ? '0' : '-1');
    }
    for (const p of people) {
      const show = p.nodes.includes(n);
      gsap.to(p.label, { opacity: show ? 1 : 0, duration: 0.5, delay: show ? 0.5 : 0, overwrite: true });
      gsap.to(p.el, { opacity: n === sun || p.nodes.some((q) => fam.has(q)) ? 1 : 0.3, duration: 0.6, overwrite: 'auto' });
    }
    if (hero) gsap.to(hero, { autoAlpha: n === sun ? 1 : 0, y: n === sun ? 0 : -10, duration: 0.5 });
    renderCrumbs();
  };

  const renderCrumbs = () => {
    const chain = [];
    for (let a = focus; a; a = a.parent) chain.unshift(a);
    crumbs.replaceChildren();
    chain.forEach((a, i) => {
      if (i) crumbs.append(Object.assign(document.createElement('span'), { className: 'cw-sep', textContent: '›' }));
      const b = Object.assign(document.createElement('button'), { type: 'button', textContent: a.data.title });
      if (i === chain.length - 1) b.setAttribute('aria-current', 'true');
      on(b, 'click', () => setFocus(a));
      crumbs.append(b);
    });
    crumbs.hidden = chain.length === 1;
  };

  // ---------------------------------------------------------------- panel
  let split;
  const chip = (label, n, extra = '') => {
    const b = Object.assign(document.createElement('button'), { type: 'button', className: `cw-chip ${extra}`, textContent: label });
    // Moons are pale tints, too light behind white text, so their chips use the team colour.
    b.style.setProperty('--c', n.kind === 'moon' ? n.parent.color : n.color);
    on(b, 'click', () => setFocus(n));
    return b;
  };

  const openPanel = (n) => {
    const d = n.data;
    panel.style.setProperty('--c', n.color);
    panel.querySelector('.cw-kicker').textContent = n.kind === 'moon' ? `Part of ${n.parent.data.title}` : 'Team';
    const title = panel.querySelector('.cw-title');
    split?.revert();
    title.textContent = d.title;
    panel.querySelector('.cw-goal').innerHTML = d.goalHtml;
    panel.querySelector('.cw-desc').innerHTML = d.descriptionHtml;

    const kids = panel.querySelector('.cw-kids');
    kids.replaceChildren(...n.children.map((c) => chip(c.data.title, c)));
    kids.parentElement.hidden = !n.children.length;

    const list = panel.querySelector('.cw-people-list');
    list.replaceChildren(
      ...d.people.map((name) => {
        const p = people.find((q) => q.name === name);
        const li = document.createElement('li');
        li.append(Object.assign(document.createElement('span'), { className: 'cw-person-name', textContent: name }));
        const elsewhere = p.nodes.filter((m) => m !== n);
        if (elsewhere.length) {
          li.append(Object.assign(document.createElement('span'), { className: 'cw-also', textContent: 'also in' }));
          li.append(...elsewhere.map((m) => chip(m.data.title, m, 'is-small')));
        }
        return li;
      }),
    );
    list.parentElement.hidden = !d.people.length;

    const kw = panel.querySelector('.cw-keywords');
    kw.replaceChildren(...d.keywords.map((k) => Object.assign(document.createElement('span'), { textContent: k })));
    kw.hidden = !d.keywords.length;

    panel.scrollTop = 0;
    panel.setAttribute('aria-hidden', 'false');
    if (!panelOpen) gsap.fromTo(panel, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: reduce ? 0 : 0.5, ease: 'power3.out' });
    panelOpen = true;
    if (!reduce) {
      split = SplitText.create(title, { type: 'words,chars' });
      gsap.from(split.chars, { yPercent: 60, opacity: 0, stagger: 0.015, duration: 0.45, ease: 'back.out(2)', delay: 0.1 });
      gsap.from(panel.querySelectorAll('.cw-section:not([hidden])'), { y: 10, opacity: 0, stagger: 0.06, duration: 0.45, delay: 0.25, ease: 'power2.out' });
    }
  };

  const closePanel = () => {
    if (!panelOpen) return;
    panelOpen = false;
    panel.setAttribute('aria-hidden', 'true');
    gsap.to(panel, { autoAlpha: 0, y: 16, duration: reduce ? 0 : 0.3, ease: 'power2.in' });
  };
  gsap.set([panel, tip], { autoAlpha: 0 });
  on(panel.querySelector('.cw-close'), 'click', () => setFocus(focus.parent ?? sun));

  // ---------------------------------------------------------------- hover
  const tipX = gsap.quickTo(tip, 'x', { duration: 0.2, ease: 'power3' });
  const tipY = gsap.quickTo(tip, 'y', { duration: 0.2, ease: 'power3' });
  const moveTip = (e) => {
    const r = stage.getBoundingClientRect();
    tipX(e.clientX - r.left + 14);
    tipY(e.clientY - r.top + 14);
  };
  const showTip = (text, e) => {
    tip.textContent = text;
    moveTip(e);
    gsap.to(tip, { autoAlpha: 1, duration: 0.15 });
  };
  const hideTip = () => gsap.to(tip, { autoAlpha: 0, duration: 0.15 });

  const highlight = (names) => {
    for (const p of people) {
      const hot = names.includes(p.name);
      p.el.classList.toggle('is-hot', hot);
      p.threads?.forEach((t) => t.classList.toggle('is-hot', hot));
    }
  };

  let hovered = null;
  const hoverIn = (n, e) => {
    hovered = n;
    // Everything holds still while you're pointing at it, so moving targets are easy to click.
    setOrbitSpeed(0, 0.5);
    gsap.to(n, { hover: n.kind === 'sun' ? 1.05 : 1.14, duration: 0.45, ease: 'back.out(3)', overwrite: 'auto' });
    highlight(n.data.people);
    const labelVisible = n.kind === 'planet' || n.kind === 'sun' || +getComputedStyle(n.el.label).opacity > 0.5;
    if (!labelVisible) showTip(n.data.title, e);
  };
  const hoverOut = (n) => {
    hovered = null;
    setOrbitSpeed(orbitSpeed, 1.2);
    gsap.to(n, { hover: 1, duration: 0.7, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' });
    highlight([]);
    hideTip();
  };

  const nodeFrom = (el) => byId.get(el.closest?.('.cw-body')?.dataset.id);
  const personFrom = (el) => people.find((p) => p.name === el.closest?.('[data-person]')?.dataset.person);

  on(svg, 'pointerover', (e) => {
    const p = personFrom(e.target);
    if (p) {
      setOrbitSpeed(0, 0.5);
      highlight([p.name]);
      showTip(`${p.name} · ${p.nodes.map((m) => m.data.title).join(', ')}`, e);
      return;
    }
    const n = nodeFrom(e.target);
    if (n === hovered) return;
    if (hovered) hoverOut(hovered);
    if (n) hoverIn(n, e);
  });
  on(svg, 'pointerout', (e) => {
    if (personFrom(e.target) && !personFrom(e.relatedTarget ?? document.body)) {
      setOrbitSpeed(orbitSpeed, 1.2);
      highlight([]);
      hideTip();
    }
    if (hovered && !nodeFrom(e.relatedTarget ?? document.body)) hoverOut(hovered);
  });
  on(svg, 'pointermove', moveTip);

  // ---------------------------------------------------------------- click / keys
  const activate = (n) => {
    hideTip();
    if (!n || n === focus) return setFocus(focus.parent ?? sun);
    if (!reduce) gsap.fromTo(n, { bump: 0.12 }, { bump: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    setFocus(n);
  };
  on(svg, 'click', (e) => {
    const p = personFrom(e.target);
    if (p) return activate(p.nodes.find((m) => m !== focus) ?? p.nodes[0]);
    activate(nodeFrom(e.target));
  });
  on(svg, 'keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const n = nodeFrom(e.target);
    if (n) {
      e.preventDefault();
      activate(n);
    }
  });
  on(document, 'keydown', (e) => {
    if (e.key === 'Escape' && focus !== sun && !e.target.closest?.('.cw-search')) setFocus(focus.parent);
  });

  // ---------------------------------------------------------------- search
  const matches = (n, q) => [n.data.title, n.data.goalHtml, ...n.data.keywords, ...n.data.people].some((s) => s.toLowerCase().includes(q));
  on(search, 'input', () => {
    const q = search.value.trim().toLowerCase();
    const found = q ? [...planets, ...moons].filter((n) => matches(n, q)) : [];
    for (const n of [...planets, ...moons]) {
      const hit = found.includes(n);
      gsap.to(n.el.body, { opacity: !q || hit || found.some((f) => f.parent === n) ? 1 : 0.25, duration: 0.35 });
      gsap.to(n.el.ring, { opacity: hit ? 1 : 0, duration: 0.35 });
      if (n.kind === 'moon') gsap.to(n.el.label, { opacity: hit || n.parent === focus ? 1 : 0, duration: 0.35, overwrite: true });
    }
    const who = q ? people.filter((p) => p.name.toLowerCase().includes(q)).map((p) => p.name) : [];
    highlight(who);
    results.replaceChildren(...found.slice(0, 8).map((n) => chip(n.data.title, n)));
    if (q && !found.length) results.textContent = 'No circles match that yet.';
    if (!reduce && found.length) gsap.from(results.children, { y: 6, opacity: 0, stagger: 0.04, duration: 0.3 });
  });
  on(search, 'keydown', (e) => {
    if (e.key === 'Enter') results.querySelector('button')?.click();
    if (e.key === 'Escape') {
      search.value = '';
      search.dispatchEvent(new Event('input'));
    }
  });

  // ---------------------------------------------------------------- life
  const ctx = gsap.context(() => {
    gsap.ticker.add(render);
    setFocus(sun, { instant: true });

    if (reduce) {
      // Still picture: nothing orbits, travellers wait halfway along their first thread.
      setOrbitSpeed(0, 0);
      travellers.forEach((p) => (p.u = 0.5));
      return;
    }

    // The sun's gentle pulse: soft rings breathing out from the centre.
    sun.el.glow.forEach((g, i) => {
      gsap.fromTo(g, { attr: { r: sun.r }, opacity: 0.35 }, {
        attr: { r: sun.r * 1.9 }, opacity: 0, duration: 4.5, repeat: -1, delay: i * 1.5, ease: 'sine.out',
      });
    });

    // Travellers: fly a leg, stop at the rim of the circle they reach (which gives a little
    // welcoming bounce), wait there a while, then set off again.
    for (const p of travellers) {
      const tl = gsap.timeline({ repeat: -1, delay: gsap.utils.random(0.5, 4) });
      const legs = p.nodes.length === 2 ? 2 : p.nodes.length;
      for (let i = 0; i < legs; i++) {
        tl.set(p, { leg: i, u: 0 })
          .to(p, { u: 1, duration: gsap.utils.random(3.5, 5.5), ease: 'power1.inOut' })
          .add(() => {
            const B = legOf(p, i)[1];
            gsap.fromTo(B, { bump: 0.07 }, { bump: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)' });
          })
          .to({}, { duration: gsap.utils.random(2, 4) });
      }
    }

    // ------------------------------------------------------------ intro: the system forms
    const intro = gsap.timeline();
    gsap.set([...planets, ...moons, sun], { appear: 0 });
    gsap.set(L.people, { opacity: 0 });
    gsap.set(L.threads, { opacity: 0 });
    gsap.set(L.rings.children, { drawSVG: '0%' });
    zoomIntro = { m: 1.7 };
    intro
      .to(zoomIntro, { m: 1, duration: 2.6, ease: 'power3.inOut', onComplete: () => (zoomIntro = null) }, 0)
      .to(sun, { appear: 1, duration: 1.1, ease: 'elastic.out(1, 0.55)' }, 0)
      .to(L.rings.children, { drawSVG: '100%', duration: 1.4, ease: 'power2.inOut' }, 0.3)
      .to(planets, { appear: 1, duration: 1.2, ease: 'back.out(1.6)', stagger: 0.12 }, 0.6)
      .to(moons, { appear: 1, duration: 0.9, ease: 'back.out(2)', stagger: 0.04 }, 1.2)
      .to(L.people, { opacity: 1, duration: 0.8 }, 1.9)
      .to(L.threads, { opacity: 1, duration: 0.8 }, 2.1);
    if (hero) {
      const h = SplitText.create(hero.querySelector('h1'), { type: 'chars' });
      intro.from(h.chars, { y: 24, opacity: 0, stagger: 0.03, duration: 0.6, ease: 'power3.out' }, 0.4);
      intro.from(hero.querySelector('p'), { y: 10, opacity: 0, duration: 0.6 }, 0.9);
    }
    on(stage, 'pointerdown', () => intro.progress(1), { once: true });
  }, stage);

  return () => {
    abort.abort();
    gsap.ticker.remove(render);
    split?.revert();
    ctx.revert();
    orbitTween.kill();
    for (const layer of Object.values(L)) layer.remove();
  };
}
