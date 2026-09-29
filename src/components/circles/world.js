// The circles world: a zoomable, living map of ecoPTO's sociocratic circles.
//
// d3-hierarchy's circle pack decides *where* every circle sits (nested, sized by what's inside).
// GSAP owns everything that *moves*: the camera, the intro, breathing, hover, and the people who
// travel between circles. Nothing is re-laid-out after mount; motion is all layered transforms.

import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { SplitText } from 'gsap/SplitText';
import { hierarchy, pack, interpolateZoom } from 'd3';

gsap.registerPlugin(MotionPathPlugin, DrawSVGPlugin, SplitText);

const NS = 'http://www.w3.org/2000/svg';
const SIZE = 1000; // world units; the pack is centred on 0,0
const PALETTE = ['#8cc084', '#4fc1b6', '#f2b55a', '#e8866a', '#86aee0', '#c49be0', '#e3d26f'];

const svgEl = (tag, attrs = {}, parent) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (parent) parent.appendChild(el);
  return el;
};

// Greedy wrap into lines of at most `max` characters.
const wrap = (text, max = 12) => {
  const lines = [];
  for (const word of text.split(/\s+/)) {
    const last = lines[lines.length - 1];
    if (last && (last + ' ' + word).length <= max) lines[lines.length - 1] = last + ' ' + word;
    else lines.push(word);
  }
  return lines;
};

export function mountWorld(stage, data) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const abort = new AbortController();
  const on = (el, type, fn, opts = {}) => el.addEventListener(type, fn, { ...opts, signal: abort.signal });

  const svg = stage.querySelector('.cw-svg');
  const camera = svg.querySelector('.cw-camera');
  const threadLayer = svg.querySelector('.cw-threads');
  const nodeLayer = svg.querySelector('.cw-nodes');
  const peopleLayer = svg.querySelector('.cw-people');
  const defs = svg.querySelector('defs');
  const crumbs = stage.querySelector('.cw-crumbs');
  const panel = stage.querySelector('.cw-panel');
  const tip = stage.querySelector('.cw-tip');
  const search = stage.querySelector('.cw-search input');
  const results = stage.querySelector('.cw-results');
  const hero = stage.querySelector('.cw-hero');
  const motes = stage.querySelector('.cw-motes');

  // ---------------------------------------------------------------- layout
  const root = hierarchy(data.root)
    .sum((d) => (d.children.length ? 0 : 1 + d.people.length * 0.3))
    .sort((a, b) => b.value - a.value);
  pack().size([SIZE, SIZE]).padding((n) => (n.depth === 0 ? 30 : 14))(root);
  const nodes = root.descendants();
  const byId = new Map();
  nodes.forEach((n) => {
    n.x -= SIZE / 2;
    n.y -= SIZE / 2;
    byId.set(n.data.id, n);
  });
  root.children?.forEach((c, i) => c.each((d) => (d.color = PALETTE[i % PALETTE.length])));
  root.color = '#dfeee4';

  // One glassy "cell" gradient per colour: soft centre, brighter membrane at the rim.
  const gradFor = new Map();
  const gradient = (color, solid) => {
    const key = color + solid;
    if (gradFor.has(key)) return gradFor.get(key);
    const id = `cw-g${gradFor.size}`;
    const g = svgEl('radialGradient', { id, cx: '42%', cy: '38%', r: '62%' }, defs);
    const stops = solid
      ? [[0, 0.95], [0.75, 0.78], [1, 0.9]]
      : [[0, 0.1], [0.82, 0.16], [0.97, 0.42], [1, 0.6]];
    for (const [o, a] of stops) svgEl('stop', { offset: o, 'stop-color': color, 'stop-opacity': a }, g);
    gradFor.set(key, `url(#${id})`);
    return gradFor.get(key);
  };

  // ---------------------------------------------------------------- build circles
  // Each circle is four nested groups so independent motions never fight over one transform:
  //   pos (intro: grows out of its parent) > nudge (hover: pushed by neighbours)
  //   > breathe (idle loop) > body + kids
  const build = (n, parentEl) => {
    const pos = svgEl('g', { class: 'cw-node' }, parentEl);
    const nudge = svgEl('g', {}, pos);
    const breathe = svgEl('g', {}, nudge);
    const body = svgEl('g', { class: 'cw-body', 'data-id': n.data.id }, breathe);
    const leaf = !n.children;
    n.el = { pos, nudge, breathe, body };
    n.el.shape = svgEl('circle', {
      class: 'cw-shape',
      r: n.r,
      fill: n.depth === 0 ? gradient(root.color, false) : gradient(n.color, leaf),
    }, body);
    n.el.ring = svgEl('circle', { class: 'cw-ring', r: n.r + Math.max(2, n.r * 0.06) }, body);
    if (n.depth > 0) {
      body.setAttribute('role', 'button');
      body.setAttribute('aria-label', `${n.data.title} circle`);
      body.setAttribute('tabindex', '-1');
    }

    // Label, sized to its circle.
    const lines = wrap(n.data.title);
    const longest = Math.max(...lines.map((l) => l.length));
    const fs = Math.min(n.r * (lines.length > 1 ? 0.26 : 0.32), (1.6 * n.r) / (longest * 0.58));
    const text = svgEl('text', { class: 'cw-label', 'font-size': fs, 'text-anchor': 'middle' });
    lines.forEach((l, i) => {
      const t = svgEl('tspan', { x: 0, y: (i - (lines.length - 1) / 2) * fs * 1.08 + fs * 0.35 }, text);
      t.textContent = l;
    });
    if (!leaf) text.setAttribute('y', 0);
    n.el.label = text;

    // Residents: people who belong only to this circle drift round inside it.
    n.el.residents = svgEl('g', { class: 'cw-residents' }, breathe);

    const kids = svgEl('g', {}, breathe);
    n.children?.forEach((c) => build(c, kids));
    // Above the child circles, so a team's name reads over its sub-circles. The wrapper lets
    // search dim the label without fighting the focus fade on the text itself.
    n.el.dimLabel = svgEl('g', {}, breathe);
    n.el.dimLabel.appendChild(text);
    gsap.set(pos, { x: n.x - (n.parent?.x ?? 0), y: n.y - (n.parent?.y ?? 0) });
  };
  build(root, nodeLayer);

  // ---------------------------------------------------------------- people
  const people = data.people.map((p, i) => ({
    ...p,
    index: i,
    nodes: p.circles.map((id) => byId.get(id)).filter(Boolean),
  }));
  const linkers = people.filter((p) => p.nodes.length > 1);
  const residents = people.filter((p) => p.nodes.length === 1);

  // Double-linked people get a thread (one curved segment per hop) and a travelling spark.
  for (const p of linkers) {
    const stops = p.nodes;
    const hops = stops.length === 2 ? [[0, 1]] : stops.map((_, i) => [i, (i + 1) % stops.length]);
    p.segments = hops.map(([a, b], h) => {
      const A = stops[a], B = stops[b];
      const dx = B.x - A.x, dy = B.y - A.y;
      const bend = (p.index % 2 ? 1 : -1) * (0.18 + (h % 3) * 0.07);
      const cx = (A.x + B.x) / 2 - dy * bend, cy = (A.y + B.y) / 2 + dx * bend;
      return svgEl('path', {
        class: 'cw-thread',
        d: `M${A.x},${A.y} Q${cx},${cy} ${B.x},${B.y}`,
        stroke: A.color || '#fff',
      }, threadLayer);
    });
    p.spark = svgEl('g', { class: 'cw-spark', tabindex: '-1' }, peopleLayer);
    p.halo = svgEl('circle', { class: 'cw-spark-halo', r: 1 }, p.spark);
    p.core = svgEl('circle', { class: 'cw-spark-core', r: 1 }, p.spark);
    p.spark.dataset.person = p.name;
    gsap.set(p.spark, { x: stops[0].x, y: stops[0].y });
  }

  for (const p of residents) {
    const n = p.nodes[0];
    const orbit = svgEl('g', {}, n.el.residents);
    const radius = n.r * (n.children ? 0.9 : 0.62);
    const angle = (p.index * 137.5) % 360;
    const dot = svgEl('circle', { class: 'cw-resident', cx: radius, cy: 0, r: Math.max(2.2, n.r * 0.05) }, orbit);
    dot.dataset.person = p.name;
    p.dot = dot;
    p.orbit = orbit;
    gsap.set(orbit, { rotation: angle, svgOrigin: '0 0' });
  }

  // ---------------------------------------------------------------- camera
  const cam = { x: 0, y: 0, k: 1 };
  let unitPx = 1; // screen px per world unit at k = 1
  const measure = () => {
    const r = svg.getBoundingClientRect();
    unitPx = Math.min(r.width, r.height) / SIZE;
    return r;
  };
  measure();

  const renderCamera = () => {
    camera.setAttribute('transform', `translate(${-cam.x * cam.k},${-cam.y * cam.k}) scale(${cam.k})`);
    // Sparks and threads keep a constant on-screen size however far in we are.
    const px = 1 / (cam.k * unitPx);
    for (const p of linkers) {
      p.core.setAttribute('r', 3.6 * px);
      p.halo.setAttribute('r', 11 * px);
    }
    threadLayer.style.setProperty('--sw', 1.4 * px);
  };

  // Where the camera should sit to frame node n, leaving room for the panel when it's open.
  const frame = (n, withPanel) => {
    const r = measure();
    let availW = r.width, availH = r.height, offX = 0, offY = 0;
    if (withPanel) {
      const pr = panel.getBoundingClientRect();
      if (r.width >= 900) { availW -= pr.width; offX = -pr.width / 2; }
      else { availH -= Math.min(pr.height, r.height * 0.55); offY = -Math.min(pr.height, r.height * 0.55) / 2; }
    }
    // A single circle with nothing inside is framed looser, so you still see the team around it.
    const k = Math.min(availW, availH) / ((n.children ? 2.3 : 4.2) * n.r * unitPx);
    return { x: n.x - offX / (unitPx * k), y: n.y - offY / (unitPx * k), k };
  };

  let camTween;
  const flyTo = (target, { instant = false } = {}) => {
    camTween?.kill();
    if (instant || reduce) {
      Object.assign(cam, target);
      renderCamera();
      return;
    }
    const zoom = interpolateZoom([cam.x, cam.y, SIZE / cam.k], [target.x, target.y, SIZE / target.k]);
    const t = { v: 0 };
    camTween = gsap.to(t, {
      v: 1,
      duration: gsap.utils.clamp(0.8, 1.8, zoom.duration / 1100),
      ease: 'power2.inOut',
      onUpdate: () => {
        const [x, y, w] = zoom(t.v);
        Object.assign(cam, { x, y, k: SIZE / w });
        renderCamera();
      },
    });
  };

  // ---------------------------------------------------------------- focus
  let focus = root;
  const inside = (n, f) => n.ancestors().includes(f);

  const setFocus = (n, { instant = false } = {}) => {
    focus = n;
    const withPanel = n !== root;
    if (withPanel) openPanel(n);
    else closePanel();
    flyTo(frame(n, withPanel), { instant });

    for (const m of nodes) {
      const labelOn = m.parent === n;
      if (m.depth > 0) gsap.to(m.el.ring, { opacity: m === n && !m.children ? 0.8 : 0, duration: 0.5, overwrite: 'auto' });
      gsap.to(m.el.label, { opacity: labelOn ? 1 : 0, duration: 0.5, delay: labelOn ? 0.35 : 0, overwrite: true });
      const dimmed = n !== root && !inside(m, n) && !n.ancestors().includes(m);
      gsap.to(m.el.shape, { opacity: dimmed ? 0.25 : 1, duration: 0.6, overwrite: 'auto' });
      if (m.depth > 0) m.el.body.setAttribute('tabindex', m.parent === n ? '0' : '-1');
    }
    hero && gsap.to(hero, { autoAlpha: n === root ? 1 : 0, y: n === root ? 0 : -12, duration: 0.5 });
    renderCrumbs();
  };

  const renderCrumbs = () => {
    crumbs.replaceChildren();
    focus.ancestors().reverse().forEach((a, i, all) => {
      if (i) crumbs.append(Object.assign(document.createElement('span'), { className: 'cw-sep', textContent: '›' }));
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = a.data.title;
      if (i === all.length - 1) b.setAttribute('aria-current', 'true');
      on(b, 'click', () => setFocus(a));
      crumbs.append(b);
    });
  };

  // ---------------------------------------------------------------- panel
  let panelOpen = false;
  let split;
  const chip = (label, n, extra = '') => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cw-chip ' + extra;
    b.style.setProperty('--c', n.color);
    b.textContent = label;
    on(b, 'click', () => setFocus(n));
    return b;
  };

  const openPanel = (n) => {
    const d = n.data;
    panel.style.setProperty('--c', n.color);
    panel.querySelector('.cw-kicker').textContent = n.parent ? `Inside ${n.parent.data.title}` : '';
    const title = panel.querySelector('.cw-title');
    split?.revert();
    title.textContent = d.title;
    panel.querySelector('.cw-goal').innerHTML = d.goalHtml;
    panel.querySelector('.cw-desc').innerHTML = d.descriptionHtml;

    const kids = panel.querySelector('.cw-kids');
    kids.replaceChildren(...(n.children ?? []).map((c) => chip(c.data.title, c)));
    kids.parentElement.hidden = !n.children;

    const list = panel.querySelector('.cw-people-list');
    list.replaceChildren(
      ...d.people.map((name) => {
        const p = people.find((q) => q.name === name);
        const li = document.createElement('li');
        const nm = Object.assign(document.createElement('span'), { className: 'cw-person', textContent: name });
        li.append(nm);
        const elsewhere = p.nodes.filter((m) => m !== n);
        if (elsewhere.length) {
          nm.classList.add('is-link');
          const also = Object.assign(document.createElement('span'), { className: 'cw-also', textContent: 'also in' });
          li.append(also, ...elsewhere.map((m) => chip(m.data.title, m, 'is-small')));
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
    if (!panelOpen) gsap.fromTo(panel, { autoAlpha: 0, xPercent: 8 }, { autoAlpha: 1, xPercent: 0, duration: reduce ? 0 : 0.6, ease: 'power3.out' });
    panelOpen = true;
    if (!reduce) {
      split = SplitText.create(title, { type: 'chars,words' });
      gsap.from(split.chars, { yPercent: 70, opacity: 0, rotate: 8, stagger: 0.018, duration: 0.5, ease: 'back.out(2)', delay: 0.15 });
      gsap.from(panel.querySelectorAll('.cw-section'), { y: 14, opacity: 0, stagger: 0.07, duration: 0.5, delay: 0.3, ease: 'power2.out' });
    }
  };

  const closePanel = () => {
    if (!panelOpen) return;
    panelOpen = false;
    panel.setAttribute('aria-hidden', 'true');
    gsap.to(panel, { autoAlpha: 0, xPercent: 8, duration: reduce ? 0 : 0.35, ease: 'power2.in' });
  };
  gsap.set([panel, tip], { autoAlpha: 0 });
  on(panel.querySelector('.cw-close'), 'click', () => setFocus(focus.parent ?? root));

  // ---------------------------------------------------------------- hover
  const tipX = gsap.quickTo(tip, 'x', { duration: 0.25, ease: 'power3' });
  const tipY = gsap.quickTo(tip, 'y', { duration: 0.25, ease: 'power3' });
  const showTip = (text, e) => {
    tip.textContent = text;
    const r = stage.getBoundingClientRect();
    tipX(e.clientX - r.left + 14);
    tipY(e.clientY - r.top + 14);
    gsap.to(tip, { autoAlpha: 1, duration: 0.2 });
  };
  const hideTip = () => gsap.to(tip, { autoAlpha: 0, duration: 0.2 });

  const highlightPeople = (names, onOff) => {
    for (const p of linkers) {
      const hit = onOff && names.includes(p.name);
      p.spark.classList.toggle('is-hot', hit);
      p.segments.forEach((s) => s.classList.toggle('is-hot', hit));
    }
    for (const p of residents) p.dot.classList.toggle('is-hot', onOff && names.includes(p.name));
  };

  const hoverIn = (n, e) => {
    if (n.depth === 0 || n === focus) return;
    gsap.to(n.el.nudge, { scale: 1.07, duration: 0.5, ease: 'back.out(3)', svgOrigin: '0 0', overwrite: 'auto' });
    // Neighbours shy away from the circle you're looking at.
    for (const s of n.parent.children) {
      if (s === n) continue;
      const dx = s.x - n.x, dy = s.y - n.y, dist = Math.hypot(dx, dy) || 1;
      const push = Math.min(n.r * 0.2, (n.r * n.r * 0.25) / dist);
      gsap.to(s.el.nudge, { x: (dx / dist) * push, y: (dy / dist) * push, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
    }
    highlightPeople(n.data.people, true);
    if (n.parent !== focus) showTip(n.data.title, e);
  };
  const hoverOut = (n) => {
    if (n.depth === 0) return;
    gsap.to(n.el.nudge, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)', svgOrigin: '0 0', overwrite: 'auto' });
    for (const s of n.parent.children) {
      if (s !== n) gsap.to(s.el.nudge, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' });
    }
    highlightPeople([], false);
    hideTip();
  };

  const nodeFrom = (target) => byId.get(target.closest?.('.cw-body')?.dataset.id);
  let hovered = null;
  on(svg, 'pointerover', (e) => {
    const person = e.target.closest?.('[data-person]');
    if (person) {
      const p = people.find((q) => q.name === person.dataset.person);
      highlightPeople([p.name], true);
      showTip(`${p.name} · ${p.nodes.map((m) => m.data.title).join(' · ')}`, e);
      return;
    }
    const n = nodeFrom(e.target);
    if (n === hovered) return;
    if (hovered) hoverOut(hovered);
    hovered = n;
    if (n) hoverIn(n, e);
  });
  on(svg, 'pointermove', (e) => {
    if (tip.style.visibility !== 'hidden') {
      const r = stage.getBoundingClientRect();
      tipX(e.clientX - r.left + 14);
      tipY(e.clientY - r.top + 14);
    }
  });
  on(svg, 'pointerleave', () => {
    if (hovered) hoverOut(hovered);
    hovered = null;
    hideTip();
  });
  on(svg, 'pointerout', (e) => {
    if (e.target.closest?.('[data-person]')) {
      highlightPeople([], false);
      hideTip();
    }
  });

  // ---------------------------------------------------------------- click / keys
  const activate = (n) => {
    if (!n) return setFocus(focus.parent ?? root);
    if (n === focus) return setFocus(n.parent ?? root);
    // A circle that isn't a direct child of what you're looking at: walk to it anyway.
    if (!reduce) {
      const pulse = svgEl('circle', { class: 'cw-pulse', r: n.r }, n.el.body);
      gsap.fromTo(pulse, { opacity: 0.9 }, { attr: { r: n.r * 1.3 }, opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: () => pulse.remove() });
    }
    setFocus(n);
  };
  on(svg, 'click', (e) => {
    hideTip();
    const person = e.target.closest?.('[data-person]');
    if (person) {
      const p = people.find((q) => q.name === person.dataset.person);
      return activate(p.nodes.find((m) => m !== focus) ?? p.nodes[0]);
    }
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
    if (e.key === 'Escape' && focus !== root && !e.target.closest?.('.cw-search')) setFocus(focus.parent);
  });

  // ---------------------------------------------------------------- search
  const matches = (n, q) =>
    [n.data.title, n.data.goalHtml, ...n.data.keywords, ...n.data.people].some((s) => s.toLowerCase().includes(q));

  on(search, 'input', () => {
    const q = search.value.trim().toLowerCase();
    const found = q ? nodes.filter((n) => n.depth > 0 && matches(n, q)) : [];
    for (const n of nodes) {
      if (n.depth === 0) continue;
      const hit = found.includes(n);
      gsap.to([n.el.body, n.el.dimLabel], { opacity: !q || hit || found.some((f) => inside(f, n)) ? 1 : 0.18, duration: 0.4 });
      gsap.to(n.el.ring, { opacity: hit ? 1 : 0, duration: 0.4, overwrite: 'auto' });
    }
    const hitPeople = q ? people.filter((p) => p.name.toLowerCase().includes(q)).map((p) => p.name) : [];
    highlightPeople(hitPeople, hitPeople.length > 0);
    results.replaceChildren(...found.slice(0, 8).map((n) => chip(n.data.title, n)));
    if (q && !found.length) results.textContent = 'No circles match that yet.';
    if (!reduce && found.length) gsap.from(results.children, { y: 8, opacity: 0, stagger: 0.04, duration: 0.3 });
  });
  on(search, 'keydown', (e) => {
    if (e.key === 'Enter') results.querySelector('button')?.click();
    if (e.key === 'Escape') {
      search.value = '';
      search.dispatchEvent(new Event('input'));
    }
  });

  // ---------------------------------------------------------------- resize
  const ro = new ResizeObserver(() => {
    const t = frame(focus, focus !== root);
    Object.assign(cam, t);
    camTween?.kill();
    renderCamera();
  });

  // ---------------------------------------------------------------- life
  const ctx = gsap.context(() => {
    Object.assign(cam, frame(root, false));
    renderCamera();
    ro.observe(svg);

    if (reduce) {
      setFocus(root, { instant: true });
      gsap.set(threadLayer.children, { opacity: 0.5 });
      linkers.forEach((p) => {
        const mid = p.segments[0].getPointAtLength(p.segments[0].getTotalLength() / 2);
        gsap.set(p.spark, { x: mid.x, y: mid.y });
      });
      return;
    }

    // Idle life: every circle breathes on its own rhythm, and cells wobble a little out of round.
    for (const n of nodes) {
      if (n.depth === 0) continue;
      gsap.to(n.el.breathe, {
        scale: 1 + (n.children ? 0.012 : 0.03),
        svgOrigin: '0 0',
        duration: gsap.utils.random(2.4, 4.6),
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: gsap.utils.random(0, 2),
      });
      if (!n.children) {
        gsap.to(n.el.shape, { scaleX: 1.035, svgOrigin: '0 0', duration: gsap.utils.random(1.8, 2.6), repeat: -1, yoyo: true, ease: 'sine.inOut' });
        gsap.to(n.el.shape, { scaleY: 1.035, svgOrigin: '0 0', duration: gsap.utils.random(2.2, 3.2), repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.7 });
      }
    }
    for (const p of residents) {
      gsap.to(p.orbit, { rotation: '+=360', svgOrigin: '0 0', duration: gsap.utils.random(30, 60), repeat: -1, ease: 'none' });
    }

    // Double links: each spark travels its thread, pausing in every circle it belongs to and
    // leaving a ripple there, like carrying news from one meeting to the next.
    const ripple = (n) => {
      const px = 1 / (cam.k * unitPx);
      const c = svgEl('circle', { class: 'cw-ripple', cx: n.x, cy: n.y, r: n.r * 0.2, stroke: n.color }, peopleLayer);
      gsap.fromTo(c, { attr: { r: 6 * px }, opacity: 0.9 }, { attr: { r: 40 * px }, opacity: 0, duration: 1.4, ease: 'power2.out', onComplete: () => c.remove() });
    };
    for (const p of linkers) {
      const tl = gsap.timeline({ repeat: -1, delay: gsap.utils.random(0, 3) });
      const legs = p.segments.length === 1
        ? [[p.segments[0], 0, 1, p.nodes[1]], [p.segments[0], 1, 0, p.nodes[0]]]
        : p.segments.map((s, i) => [s, 0, 1, p.nodes[(i + 1) % p.nodes.length]]);
      for (const [path, start, end, arrive] of legs) {
        tl.to(p.spark, {
          motionPath: { path, start, end },
          duration: gsap.utils.random(3, 5),
          ease: 'power1.inOut',
          onComplete: () => ripple(arrive),
        }).to({}, { duration: gsap.utils.random(1, 2.5) });
      }
    }

    // Ambient motes drifting in the water.
    for (let i = 0; i < 26; i++) {
      const m = document.createElement('span');
      motes.append(m);
      gsap.set(m, { left: `${gsap.utils.random(0, 100)}%`, top: `${gsap.utils.random(0, 100)}%`, scale: gsap.utils.random(0.4, 1.3), opacity: gsap.utils.random(0.15, 0.5) });
      gsap.to(m, { x: 'random(-60, 60)', y: 'random(-80, 40)', duration: 'random(8, 16)', repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }

    // ------------------------------------------------------------ intro: one cell becomes a world
    const intro = gsap.timeline({ defaults: { ease: 'back.out(1.5)' } });
    const levels = [];
    nodes.forEach((n) => (levels[n.depth] ??= []).push(n));
    gsap.set(nodes.map((n) => n.el.pos), { scale: 0, svgOrigin: '0 0' });
    levels.slice(1).flat().forEach((n) => gsap.set(n.el.pos, { x: 0, y: 0 }));
    gsap.set(peopleLayer, { opacity: 0 });
    gsap.set(threadLayer.children, { drawSVG: '0%' });
    setFocus(root, { instant: true });
    const start = frame(root, false);
    Object.assign(cam, { ...start, k: start.k * 1.8 });
    renderCamera();

    intro.to(root.el.pos, { scale: 1, duration: 1.1, ease: 'elastic.out(1, 0.6)' });
    flyToIntro(intro, start);
    levels.slice(1).forEach((level, i) => {
      intro.to(level.map((n) => n.el.pos), {
        scale: 1,
        x: (_, el) => { const n = level.find((m) => m.el.pos === el); return n.x - n.parent.x; },
        y: (_, el) => { const n = level.find((m) => m.el.pos === el); return n.y - n.parent.y; },
        duration: 0.9,
        stagger: { each: 0.06, from: 'random' },
      }, i === 0 ? 0.55 : '-=0.5');
    });
    intro.to(threadLayer.children, { drawSVG: '100%', duration: 1.2, stagger: 0.05, ease: 'power2.inOut' }, '-=0.3');
    intro.to(peopleLayer, { opacity: 1, duration: 0.6 }, '<0.4');
    if (hero) {
      const h = SplitText.create(hero.querySelector('h1'), { type: 'chars' });
      intro.from(h.chars, { y: 30, opacity: 0, stagger: 0.03, duration: 0.6, ease: 'power3.out' }, 0.3);
      intro.from(hero.querySelector('p'), { y: 12, opacity: 0, duration: 0.6 }, 0.9);
    }
    const skip = () => intro.progress(1);
    on(stage, 'pointerdown', skip, { once: true });
  }, stage);

  // The intro pulls the camera back from close up while the world grows.
  function flyToIntro(tl, target) {
    tl.to(cam, { ...target, duration: 2.4, ease: 'power3.inOut', onUpdate: renderCamera }, 0);
  }

  return () => {
    abort.abort();
    ro.disconnect();
    camTween?.kill();
    split?.revert();
    ctx.revert();
    motes.replaceChildren();
  };
}
