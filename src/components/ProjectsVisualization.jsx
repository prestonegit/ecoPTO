import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

/* ------------------------------------------------------------------ *
 *  The Living Garden
 *  A map of ecoPTO's circles as plants in a community garden.
 *  Each circle is a hand-drawn plant whose growth stage reflects how
 *  established the effort is: seed -> sprout -> bush -> blooming -> tree.
 *  ecoPTO is the great tree everything is rooted to. People are seeds
 *  drifting around the circles they tend; vines tie it all together.
 * ------------------------------------------------------------------ */

const STAGES = ['seed', 'sprout', 'bush', 'blooming', 'tree'];
const SIZE = {
  seed: { r: 30, plot: 24 },
  sprout: { r: 35, plot: 30 },
  bush: { r: 44, plot: 38 },
  blooming: { r: 50, plot: 42 },
  tree: { r: 60, plot: 46 },
};

const stageOf = (data) => {
  if (data.stage && STAGES.includes(data.stage)) return data.stage;
  const n = data.members ?? (data.participants ? data.participants.length : 1);
  if (n <= 1) return 'seed';
  if (n <= 2) return 'sprout';
  if (n <= 4) return 'bush';
  if (n <= 7) return 'blooming';
  return 'tree';
};

const ProjectModal = ({ project, onClose }) => {
  if (!project) return null;
  const d = project.data;
  return (
    <div className="garden-overlay fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="garden-card relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-[1.75rem] bg-[#FFFDF8] shadow-[0_30px_80px_-20px_rgba(120,58,36,0.45)]" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-24 overflow-hidden rounded-t-[1.75rem]"
             style={{ background: 'radial-gradient(120% 140% at 25% 15%, #E8A877 0%, #C0683F 55%, #9E4A2E 100%)' }}>
          <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
               style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')" }} />
          <span className="absolute left-8 top-6 h-2.5 w-2.5 rounded-full bg-[#FFD9BE]/80" />
          <span className="absolute left-16 top-12 h-1.5 w-1.5 rounded-full bg-[#FFEAD9]/70" />
          <span className="absolute right-12 top-8 h-2 w-2 rounded-full bg-[#FFD9BE]/60" />
        </div>
        <button onClick={onClose}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/85 text-[#9E4A2E] shadow-md backdrop-blur transition hover:scale-110 hover:bg-white"
          aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="px-8 pb-8 pt-6">
          <h2 className="font-serif text-3xl leading-tight text-primary">{d.title}</h2>
          {d.goal && (
            <p className="mt-3 border-l-2 border-secondary pl-4 font-serif text-lg italic leading-snug text-[#7A5036]">{d.goal}</p>
          )}
          {d.description && (
            <p className="mt-5 font-sans text-[15px] leading-relaxed text-[#4A4036]">{d.description}</p>
          )}
          {d.participants && d.participants.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.18em] text-[#B08968]">Tending this circle</h3>
              <ul className="grid grid-cols-1 gap-2 font-sans text-[15px] text-[#4A4036] sm:grid-cols-2">
                {d.participants.map((p) => (
                  <li key={p.name} className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: 'radial-gradient(circle at 35% 30%, #FFD9BE, #F0A06A)' }} />
                    <span>{p.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {d.keywords && d.keywords.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {d.keywords.map((k) => (
                <span key={k} className="rounded-full border border-secondary/60 bg-secondary/20 px-3 py-1 font-sans text-xs font-semibold text-[#9E4A2E]">{k}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProjectsVisualization = ({ projects }) => {
  const ref = useRef();
  const searchRef = useRef('');
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const width = 1000;
    const height = 820;
    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('preserveAspectRatio', 'xMidYMid meet').style('cursor', 'grab');

    const css = getComputedStyle(document.documentElement);
    const primary = css.getPropertyValue('--primary').trim() || '#B05B3B';

    // garden palette
    const leafD = '#4E6B33', leafM = '#6E8C44', leafL = '#9CB45C', leafHi = '#B6CE72';
    const trunkC = '#8A6038', trunkD = '#6A4526';
    const vineStruct = 'rgba(120,80,46,0.40)';
    const vineMemb = 'rgba(176,120,72,0.50)';
    const blossoms = ['#FF8A6B', '#FF9FB0', '#F6B85C', '#FFC099'];

    /* ---------------- data ---------------- */
    const rand = () => Math.random();
    const life = (type) => ({
      breathePhase: rand() * Math.PI * 2,
      breatheSpeed: 0.7 + rand() * 0.5,
      breatheAmp: type === 'person' ? 0.05 : 0.018,
      swayPhase: rand() * Math.PI * 2,
      swaySpeed: 0.6 + rand() * 0.6,
      bobPhaseX: rand() * Math.PI * 2,
      bobPhaseY: rand() * Math.PI * 2,
      bobSpeedX: 0.3 + rand() * 0.35,
      bobSpeedY: 0.3 + rand() * 0.35,
      bobAmp: type === 'project' ? 5 : type === 'person' ? 4 : 2,
      bloom: 0, bloomCur: 0, growIn: 0, matched: true,
    });

    const rootNode = { id: 'ecopto', title: 'ecoPTO', type: 'root', stage: 'root', r: 82, plotRx: 70, swayAmp: 1.6, delay: 0, ...life('root') };

    const projectNodes = projects.map((p, i) => {
      const stage = stageOf(p.data);
      const sz = SIZE[stage];
      return {
        id: p.slug, title: p.data.title, data: p.data, type: 'project', stage,
        r: sz.r, plotRx: sz.plot,
        swayAmp: stage === 'seed' || stage === 'sprout' ? 4.5 : stage === 'tree' ? 2 : 3,
        seed: rand(), delay: 0.15 + i * 0.12, ...life('project'),
      };
    });

    const peopleMap = new Map();
    projects.forEach((p) => {
      (p.data.participants || []).forEach((pt) => {
        if (!peopleMap.has(pt.name)) {
          const insect = ['bee', 'butterfly', 'ladybug'][peopleMap.size % 3];
          peopleMap.set(pt.name, { id: `person-${pt.name.replace(/\s+/g, '-').toLowerCase()}`, name: pt.name, type: 'person', r: 10, insect, wingPhase: rand() * Math.PI * 2, wingSpeed: insect === 'butterfly' ? 8 : 16, projects: [], delay: 0.6, ...life('person') });
        }
        peopleMap.get(pt.name).projects.push(p.slug);
      });
    });
    const personNodes = Array.from(peopleMap.values());
    const nodes = [rootNode, ...projectNodes, ...personNodes];

    const links = [];
    projectNodes.forEach((p) => links.push({ source: 'ecopto', target: p.id, kind: 'structure', distance: 250 + p.r }));
    personNodes.forEach((person) => person.projects.forEach((slug) => links.push({ source: person.id, target: slug, kind: 'membership', distance: 58 })));

    const linkedById = {};
    links.forEach((l) => { (linkedById[l.source] ||= new Set()).add(l.target); (linkedById[l.target] ||= new Set()).add(l.source); });
    const connected = (a, b) => a === b || linkedById[a]?.has(b);

    /* ---------------- simulation ---------------- */
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance((d) => d.distance).strength(0.5))
      .force('charge', d3.forceManyBody().strength((d) => (d.type === 'root' ? -1700 : d.type === 'project' ? -1000 : -150)))
      .force('collide', d3.forceCollide().radius((d) => d.r + 24).iterations(2))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .velocityDecay(0.6);

    /* ---------------- defs ---------------- */
    const defs = svg.append('defs');
    const radial = (id, stops, cx = '38%', cy = '26%', r = '75%') => {
      const g = defs.append('radialGradient').attr('id', id).attr('cx', cx).attr('cy', cy).attr('r', r);
      stops.forEach(([o, c]) => g.append('stop').attr('offset', o).attr('stop-color', c));
    };
    radial('soil-grad', [['0%', '#B98A5E'], ['55%', '#94633E'], ['100%', '#724B2D']], '42%', '22%');
    radial('canopy-grad', [['0%', leafL], ['55%', leafM], ['100%', leafD]], '34%', '24%');
    radial('glow-grad', [['0%', 'rgba(255,206,150,0.6)'], ['60%', 'rgba(255,193,153,0.18)'], ['100%', 'rgba(255,193,153,0)']], '50%', '50%', '50%');

    const blur = defs.append('filter').attr('id', 'softblur').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    blur.append('feGaussianBlur').attr('stdDeviation', '4');

    const shadow = defs.append('filter').attr('id', 'plantshadow').attr('x', '-60%').attr('y', '-60%').attr('width', '220%').attr('height', '220%');
    shadow.append('feDropShadow').attr('dx', '0').attr('dy', '6').attr('stdDeviation', '7').attr('flood-color', '#5E3A20').attr('flood-opacity', '0.25');

    /* ---------------- drawing helpers ---------------- */
    const leafPath = (len, w) => `M0,0 C ${w},${-len * 0.32} ${w * 0.65},${-len * 0.86} 0,${-len} C ${-w * 0.65},${-len * 0.86} ${-w},${-len * 0.32} 0,0 Z`;
    const drawLeaf = (g, len, w, angle, fill) =>
      g.append('path').attr('d', leafPath(len, w)).attr('transform', `rotate(${angle})`).attr('fill', fill)
        .attr('stroke', 'rgba(35,55,25,0.18)').attr('stroke-width', 0.6);

    const drawPlot = (g, rx) => {
      const ry = rx * 0.42;
      g.append('ellipse').attr('cx', 0).attr('cy', ry * 0.5).attr('rx', rx * 1.04).attr('ry', ry).attr('fill', '#5E3A20').attr('opacity', 0.18).attr('filter', 'url(#softblur)');
      g.append('ellipse').attr('cx', 0).attr('cy', 0).attr('rx', rx).attr('ry', ry).attr('fill', 'url(#soil-grad)');
      g.append('ellipse').attr('cx', 0).attr('cy', -ry * 0.16).attr('rx', rx * 0.9).attr('ry', ry * 0.78).attr('fill', 'none').attr('stroke', 'rgba(255,240,222,0.22)').attr('stroke-width', 1.4);
      return ry;
    };

    const drawStem = (g, h, wdt = 3) =>
      g.append('path').attr('d', `M0,0 Q ${-h * 0.12},${-h * 0.5} 0,${-h}`).attr('fill', 'none').attr('stroke', trunkC).attr('stroke-width', wdt).attr('stroke-linecap', 'round');

    const drawTrunk = (g, h, w) =>
      g.append('path').attr('d', `M${-w / 2},2 Q ${-w * 0.34},${-h * 0.55} ${-w * 0.32},${-h} L ${w * 0.32},${-h} Q ${w * 0.34},${-h * 0.55} ${w / 2},2 Z`)
        .attr('fill', trunkC).attr('stroke', trunkD).attr('stroke-width', 1);

    const drawCanopy = (g, w) => {
      const r = w / 2;
      // base shadow mass
      g.append('ellipse').attr('cx', 0).attr('cy', r * 0.14).attr('rx', r).attr('ry', r * 0.82).attr('fill', leafD);
      // fuller overlapping lobes
      [[-0.5, 0.05, 0.62], [0.5, 0.05, 0.62], [0, -0.38, 0.72], [-0.34, -0.2, 0.5], [0.34, -0.2, 0.5], [0, 0.28, 0.6]].forEach(([cx, cy, rr]) =>
        g.append('ellipse').attr('cx', r * cx).attr('cy', r * cy).attr('rx', r * rr).attr('ry', r * (rr - 0.02)).attr('fill', 'url(#canopy-grad)'));
      // dark leaf-cluster texture
      [[-0.4, 0.25, 0.2], [0.42, 0.18, 0.18], [-0.05, 0.36, 0.16]].forEach(([cx, cy, rr]) =>
        g.append('ellipse').attr('cx', r * cx).attr('cy', r * cy).attr('rx', r * rr).attr('ry', r * rr).attr('fill', leafD).attr('opacity', 0.32));
      // sunlit highlight dabs
      [[-0.28, -0.46, 0.24, 0.17], [0.2, -0.34, 0.16, 0.12], [-0.04, -0.52, 0.13, 0.1]].forEach(([cx, cy, rx, ry]) =>
        g.append('ellipse').attr('cx', r * cx).attr('cy', r * cy).attr('rx', r * rx).attr('ry', r * ry).attr('fill', leafHi).attr('opacity', 0.7));
    };

    const drawBlossom = (g, x, y, s, color) => {
      const f = g.append('g').attr('transform', `translate(${x},${y})`);
      for (let i = 0; i < 5; i++) f.append('ellipse').attr('rx', s * 0.62).attr('ry', s).attr('cy', -s * 0.9).attr('transform', `rotate(${i * 72})`).attr('fill', color);
      f.append('circle').attr('r', s * 0.6).attr('fill', '#F6C453');
      return f;
    };

    // Pollinator insects stand in for "people" (no gender/age implied). Each has a
    // .wings group that flutters in the render loop.
    const drawInsect = (g, d) => {
      const b = g.append('g').attr('class', 'insect').attr('transform', 'scale(1.3)');
      if (d.insect === 'bee') {
        const wings = b.append('g').attr('class', 'wings');
        wings.append('ellipse').attr('cx', -4.5).attr('cy', -1).attr('rx', 3.6).attr('ry', 5.4).attr('fill', 'rgba(255,255,255,0.55)').attr('stroke', 'rgba(150,130,90,0.5)').attr('stroke-width', 0.4).attr('transform', 'rotate(-22 -4.5 -1)');
        wings.append('ellipse').attr('cx', 4.5).attr('cy', -1).attr('rx', 3.6).attr('ry', 5.4).attr('fill', 'rgba(255,255,255,0.55)').attr('stroke', 'rgba(150,130,90,0.5)').attr('stroke-width', 0.4).attr('transform', 'rotate(22 4.5 -1)');
        b.append('ellipse').attr('rx', 5).attr('ry', 7).attr('fill', '#E3A83C');
        [-3.2, 0, 3.2].forEach((yy) => b.append('ellipse').attr('cy', yy).attr('rx', 4.4 - Math.abs(yy) * 0.28).attr('ry', 1.1).attr('fill', '#4A2E14'));
        b.append('circle').attr('cy', -7).attr('r', 2.6).attr('fill', '#33200E');
        b.append('circle').attr('cx', -1).attr('cy', -7.6).attr('r', 0.5).attr('fill', '#fff').attr('opacity', 0.7);
      } else if (d.insect === 'butterfly') {
        const wings = b.append('g').attr('class', 'wings');
        wings.append('ellipse').attr('cx', -5).attr('cy', -3.5).attr('rx', 5).attr('ry', 6.2).attr('fill', '#FF9E6B').attr('transform', 'rotate(-18 -5 -3.5)');
        wings.append('ellipse').attr('cx', 5).attr('cy', -3.5).attr('rx', 5).attr('ry', 6.2).attr('fill', '#FF9E6B').attr('transform', 'rotate(18 5 -3.5)');
        wings.append('ellipse').attr('cx', -4).attr('cy', 4).attr('rx', 4).attr('ry', 4.4).attr('fill', '#FFC4A0').attr('transform', 'rotate(20 -4 4)');
        wings.append('ellipse').attr('cx', 4).attr('cy', 4).attr('rx', 4).attr('ry', 4.4).attr('fill', '#FFC4A0').attr('transform', 'rotate(-20 4 4)');
        wings.append('circle').attr('cx', -5.4).attr('cy', -4).attr('r', 1.3).attr('fill', '#B0432B').attr('opacity', 0.7);
        wings.append('circle').attr('cx', 5.4).attr('cy', -4).attr('r', 1.3).attr('fill', '#B0432B').attr('opacity', 0.7);
        b.append('ellipse').attr('rx', 1.3).attr('ry', 7).attr('fill', '#3A2410');
        b.append('path').attr('d', 'M-0.6,-6 Q-2.6,-9.5 -3.4,-10.6').attr('fill', 'none').attr('stroke', '#3A2410').attr('stroke-width', 0.6);
        b.append('path').attr('d', 'M0.6,-6 Q2.6,-9.5 3.4,-10.6').attr('fill', 'none').attr('stroke', '#3A2410').attr('stroke-width', 0.6);
      } else { // ladybug
        b.append('ellipse').attr('rx', 6).attr('ry', 6.6).attr('fill', '#D8463A');
        b.append('path').attr('d', 'M0,-6.4 L0,6').attr('stroke', '#2A1810').attr('stroke-width', 1);
        [[-3, -2.5], [3, -2.5], [-3.2, 2.6], [3.2, 2.6], [-1.7, 0.4], [1.7, 0.4]].forEach(([sx, sy]) => b.append('circle').attr('cx', sx).attr('cy', sy).attr('r', 1.3).attr('fill', '#2A1810'));
        b.append('ellipse').attr('cy', -6.4).attr('rx', 3.2).attr('ry', 2.6).attr('fill', '#1E120A');
        b.append('circle').attr('cx', -1.3).attr('cy', -6.8).attr('r', 0.6).attr('fill', '#fff').attr('opacity', 0.6);
        b.append('circle').attr('cx', 1.3).attr('cy', -6.8).attr('r', 0.6).attr('fill', '#fff').attr('opacity', 0.6);
      }
    };

    // build a plant for a project node; returns the .sway group
    const buildProject = (plant, d) => {
      const R = d.r;
      const rng = d3.randomLcg(d.seed);
      const pick = (arr) => arr[Math.floor(rng() * arr.length)];

      if (d.stage === 'seed') {
        const sw = plant.append('g').attr('class', 'sway');
        drawStem(sw, R * 0.42, 2.4);
        drawLeaf(sw, R * 0.34, R * 0.2, -52, leafM).attr('transform', `translate(0,${-R * 0.34}) rotate(-52)`);
        drawLeaf(sw, R * 0.34, R * 0.2, 52, leafM).attr('transform', `translate(0,${-R * 0.34}) rotate(52)`);
        plant.append('path').attr('d', `M${-R * 0.18},2 Q0,${-R * 0.14} ${R * 0.18},2 Z`).attr('fill', '#7A5232'); // seed husk
      } else if (d.stage === 'sprout') {
        const sw = plant.append('g').attr('class', 'sway');
        drawStem(sw, R * 0.74, 3);
        [[-58, 0.34], [62, 0.5], [-52, 0.66]].forEach(([a, t]) =>
          drawLeaf(sw, R * 0.36, R * 0.2, a, leafM).attr('transform', `translate(0,${-R * t}) rotate(${a})`));
        drawLeaf(sw, R * 0.4, R * 0.22, 0, leafL).attr('transform', `translate(0,${-R * 0.74})`);
      } else if (d.stage === 'bush' || d.stage === 'blooming') {
        const sw = plant.append('g').attr('class', 'sway');
        const n = d.stage === 'blooming' ? 9 : 8;
        for (let i = 0; i < n; i++) {
          const a = -78 + (156 / (n - 1)) * i + (rng() - 0.5) * 8;
          const len = R * (0.62 + rng() * 0.28);
          drawLeaf(sw, len, len * 0.42, a, i % 2 ? leafM : leafD);
        }
        for (let i = 0; i < 4; i++) {
          const a = -40 + 26 * i;
          drawLeaf(sw, R * 0.6, R * 0.26, a, leafL);
        }
        if (d.stage === 'blooming') {
          const spots = [[-0.42, -0.64, 0.17], [0.38, -0.58, 0.15], [0, -0.95, 0.19], [-0.16, -0.8, 0.13], [0.22, -0.86, 0.14]];
          spots.forEach((s, i) => drawBlossom(sw, R * s[0], R * s[1], R * s[2], blossoms[i % blossoms.length]));
          [[-0.55, -0.42], [0.5, -0.34]].forEach((b, i) => sw.append('circle').attr('cx', R * b[0]).attr('cy', R * b[1]).attr('r', R * 0.07).attr('fill', blossoms[(i + 2) % blossoms.length]));
        } else { // bush also gets a few small blossoms
          [[-0.32, -0.54, 0.12], [0.34, -0.48, 0.11], [0.02, -0.66, 0.1]].forEach((s, i) => drawBlossom(sw, R * s[0], R * s[1], R * s[2], blossoms[(i + 1) % blossoms.length]));
        }
      } else { // tree (flowering)
        drawTrunk(plant, R * 0.62, R * 0.2);
        const sw = plant.append('g').attr('class', 'sway').attr('transform', `translate(0,${-R * 0.62})`);
        drawCanopy(sw, R * 1.5);
        [[-0.5, -0.2], [0.46, -0.08], [0.05, -0.52], [-0.2, 0.1]].forEach((b, i) => drawBlossom(sw, R * b[0], R * b[1], R * 0.085, blossoms[i % blossoms.length]));
      }

      if (!plant.select('.sway').node()) plant.append('g').attr('class', 'sway');
    };

    /* ---------------- zoom ---------------- */
    const g = svg.append('g');
    const zoom = d3.zoom().scaleExtent([0.3, 4]).on('zoom', (e) => g.attr('transform', e.transform));
    svg.call(zoom);
    const s0 = 0.96;
    svg.call(zoom.transform, d3.zoomIdentity.translate(width * (1 - s0) / 2, height * (1 - s0) / 2).scale(s0));

    /* ---------------- vines ---------------- */
    const link = g.append('g').attr('class', 'links').selectAll('path').data(links).join('path')
      .attr('fill', 'none').attr('stroke-linecap', 'round')
      .attr('stroke', (d) => (d.kind === 'structure' ? vineStruct : vineMemb))
      .attr('stroke-width', (d) => (d.kind === 'structure' ? 2.4 : 1.5))
      .attr('stroke-dasharray', (d) => (d.kind === 'membership' ? '1 6' : null));

    /* ---------------- nodes ---------------- */
    const node = g.append('g').attr('class', 'nodes').selectAll('g.node').data(nodes).join('g').attr('class', 'node')
      .call(d3.drag().on('start', dragstart).on('drag', dragged).on('end', dragend));

    node.each(function (d) {
      const el = d3.select(this);
      const plant = el.append('g').attr('class', 'plant');

      if (d.type === 'root') {
        plant.append('ellipse').attr('class', 'glow').attr('cx', 0).attr('cy', -d.r * 0.7).attr('rx', d.r * 1.7).attr('ry', d.r * 1.7).attr('fill', 'url(#glow-grad)');
        drawPlot(plant, d.plotRx);
        drawTrunk(plant, d.r * 0.66, d.r * 0.22);
        const sw = plant.append('g').attr('class', 'sway').attr('transform', `translate(0,${-d.r * 0.66})`);
        drawCanopy(sw, d.r * 1.7);
        [[-d.r * 0.5, -d.r * 0.2], [d.r * 0.5, -d.r * 0.25], [0, -d.r * 0.6], [-d.r * 0.2, -d.r * 0.55]].forEach((s, i) => drawBlossom(sw, s[0], s[1], d.r * 0.12, blossoms[i % blossoms.length]));
        el.append('text').attr('class', 'nlabel').text('ecoPTO').attr('text-anchor', 'middle').attr('y', d.plotRx * 0.42 + 22)
          .style('font-family', 'var(--font-serif)').style('font-weight', '700').style('font-size', '24px').style('fill', '#7E3A24').style('pointer-events', 'none');
        // hit
        plant.append('rect').attr('class', 'hit').attr('x', -d.r).attr('y', -d.r * 2).attr('width', d.r * 2).attr('height', d.r * 2.2).attr('fill', 'transparent');
      } else if (d.type === 'project') {
        drawPlot(plant, d.plotRx);
        buildProject(plant, d);
        const lab = el.append('text').attr('class', 'nlabel').attr('text-anchor', 'middle').attr('y', d.plotRx * 0.42 + 16)
          .style('font-family', 'var(--font-serif)').style('font-weight', '600').style('font-size', '15px').style('fill', '#5C3A22').style('pointer-events', 'none');
        // wrap long titles into two lines
        const words = d.title.split(' ');
        if (words.length > 2) {
          const mid = Math.ceil(words.length / 2);
          lab.append('tspan').attr('x', 0).attr('dy', 0).text(words.slice(0, mid).join(' '));
          lab.append('tspan').attr('x', 0).attr('dy', '1.05em').text(words.slice(mid).join(' '));
        } else {
          lab.text(d.title);
        }
        plant.append('rect').attr('class', 'hit').attr('x', -d.r).attr('y', -d.r * 1.9).attr('width', d.r * 2).attr('height', d.r * 2.1).attr('fill', 'transparent').style('cursor', 'pointer')
          .on('mouseover', () => highlight(d)).on('mouseout', () => unhighlight(d))
          .on('click', (e) => { if (e.defaultPrevented) return; e.stopPropagation(); setSelectedProject(d); });
      } else { // person -> pollinator insect (bee / butterfly / ladybug)
        drawInsect(plant, d);
        el.append('text').attr('class', 'pname').text(d.name).attr('text-anchor', 'middle').attr('y', d.r + 8)
          .style('font-family', 'var(--font-sans)').style('font-size', '11px').style('font-weight', '600').style('fill', '#8A5E45').style('opacity', 0).style('pointer-events', 'none');
        plant.append('rect').attr('class', 'hit').attr('x', -d.r * 1.6).attr('y', -d.r * 1.8).attr('width', d.r * 3.2).attr('height', d.r * 2.8).attr('fill', 'transparent');
      }
    });

    /* ---------------- highlight / search ---------------- */
    const setLabelsFor = (id, on) =>
      node.filter((n) => n.type === 'person' && connected(id, n.id)).select('.pname').transition().duration(150).style('opacity', on ? 1 : 0);

    function highlight(d) {
      d.bloom = 1; setLabelsFor(d.id, true);
      if (searchRef.current.trim()) return;
      node.transition().duration(200).style('opacity', (n) => (connected(d.id, n.id) ? 1 : 0.16));
      link.transition().duration(200)
        .style('opacity', (l) => (l.source.id === d.id || l.target.id === d.id ? 1 : 0.06))
        .attr('stroke', (l) => (l.source.id === d.id || l.target.id === d.id ? primary : (l.kind === 'structure' ? vineStruct : vineMemb)))
        .attr('stroke-width', (l) => (l.source.id === d.id || l.target.id === d.id ? (l.kind === 'membership' ? 2.2 : 3) : (l.kind === 'structure' ? 2.4 : 1.5)));
    }
    function unhighlight(d) { d.bloom = 0; setLabelsFor(d.id, false); applyFilter(); }

    const matchNode = (d, q) => {
      if (d.type === 'root') return true;
      if (d.type === 'project')
        return d.title.toLowerCase().includes(q) || (d.data.goal || '').toLowerCase().includes(q) || (d.data.description || '').toLowerCase().includes(q) || (d.data.keywords || []).some((k) => k.toLowerCase().includes(q));
      return d.name.toLowerCase().includes(q);
    };
    function applyFilter() {
      const q = searchRef.current.trim().toLowerCase();
      node.each((d) => { d.matched = q ? matchNode(d, q) : true; });
      node.transition().duration(250).style('opacity', (d) => (d.matched ? 1 : 0.1));
      link.transition().duration(250)
        .style('opacity', (l) => (l.source.matched && l.target.matched ? (l.kind === 'structure' ? 1 : 0.9) : 0.05))
        .attr('stroke', (l) => (l.kind === 'structure' ? vineStruct : vineMemb))
        .attr('stroke-width', (l) => (l.kind === 'structure' ? 2.4 : 1.5));
    }
    const searchInput = document.getElementById('search');
    const onInput = (e) => { searchRef.current = e.target.value; applyFilter(); };
    if (searchInput) searchInput.addEventListener('input', onInput);

    /* ---------------- drifting pollen / floating seeds ---------------- */
    const pollenData = d3.range(20).map(() => ({
      x: rand() * width, y: rand() * height, r: 0.8 + rand() * 2.4, o: 0.14 + rand() * 0.34,
      vy: 6 + rand() * 12, swayAmp: 8 + rand() * 20, swaySpeed: 0.25 + rand() * 0.5, phase: rand() * 6.28, fluff: rand() < 0.3,
    }));
    const pollenSel = g.append('g').attr('class', 'pollen').style('pointer-events', 'none').selectAll('g').data(pollenData).join('g');
    pollenSel.each(function (p) {
      const el = d3.select(this);
      if (p.fluff) for (let k = 0; k < 6; k++) el.append('line').attr('x2', Math.cos(k * 1.047) * p.r * 2.4).attr('y2', Math.sin(k * 1.047) * p.r * 2.4).attr('stroke', '#FFF4E2').attr('stroke-width', 0.4).attr('opacity', 0.5);
      el.append('circle').attr('r', p.r).attr('fill', p.fluff ? '#FFF6E8' : '#FFE3C0');
    });

    /* ---------------- render loop ---------------- */
    const plantSel = node.select('.plant');
    const swaySel = node.select('.sway');
    const glowSel = node.select('.glow');
    const labelSel = node.select('.nlabel');
    const wingSel = node.select('.wings');
    const t0 = performance.now();
    let raf, stopped = false;
    function frame(now) {
      if (stopped) return; // guard against rAF cleanup race on unmount
      const t = (now - t0) / 1000;
      node.attr('transform', (d) => {
        const bx = d.dragging ? 0 : Math.sin(t * d.bobSpeedX + d.bobPhaseX) * d.bobAmp;
        const by = d.dragging ? 0 : Math.cos(t * d.bobSpeedY + d.bobPhaseY) * d.bobAmp;
        d.cx = (d.x || width / 2) + bx; d.cy = (d.y || height / 2) + by;
        return `translate(${d.cx},${d.cy})`;
      });
      plantSel.attr('transform', (d) => {
        d.bloomCur += (d.bloom - d.bloomCur) * 0.12;
        const gt = Math.max(0, t - (d.delay || 0));
        const grow = Math.min(1, 1 - Math.pow(1 - Math.min(1, gt / 0.8), 3));
        d.growIn = grow;
        const breathe = 1 + (d.breatheAmp || 0) * Math.sin(t * d.breatheSpeed + d.breathePhase);
        const s = grow * (breathe + d.bloomCur * 0.1);
        return `scale(${s})`;
      });
      swaySel.attr('transform', function (d) {
        const base = d3.select(this).attr('data-base') || '';
        const a = (d.swayAmp || 3) * (1 + d.bloomCur * 1.4) * Math.sin(t * d.swaySpeed + d.swayPhase);
        return `${base} rotate(${a})`;
      });
      glowSel.attr('opacity', (d) => (d ? 0.6 + 0.25 * Math.sin(t * 0.8) : 0)).attr('transform', (d) => `scale(${1 + 0.05 * Math.sin(t * 0.8)})`);
      labelSel.style('opacity', (d) => d.growIn);
      wingSel.attr('transform', (d) => `scale(${0.32 + 0.68 * Math.abs(Math.sin(t * (d.wingSpeed || 12) + (d.wingPhase || 0)))},1)`);
      link.attr('d', (l) => {
        const sx = l.source.cx ?? l.source.x, sy = l.source.cy ?? l.source.y;
        const tx = l.target.cx ?? l.target.x, ty = l.target.cy ?? l.target.y;
        const dx = tx - sx, dy = ty - sy, dr = Math.hypot(dx, dy) || 1;
        const cx = (sx + tx) / 2 + (-dy / dr) * dr * 0.1;
        const cy = (sy + ty) / 2 + (dx / dr) * dr * 0.1;
        return `M${sx},${sy} Q${cx},${cy} ${tx},${ty}`;
      });
      pollenSel.attr('transform', (p) => {
        const yy = ((p.y - t * p.vy) % (height + 40) + (height + 40)) % (height + 40) - 20;
        return `translate(${p.x + Math.sin(t * p.swaySpeed + p.phase) * p.swayAmp},${yy})`;
      }).attr('opacity', (p) => p.o * (0.55 + 0.45 * Math.sin(t * 0.7 + p.phase)));
      raf = requestAnimationFrame(frame);
    }
    // preserve translate on sway groups that have one (tree canopies)
    swaySel.each(function () { const tr = this.getAttribute('transform'); if (tr) this.setAttribute('data-base', tr); });
    raf = requestAnimationFrame(frame);

    /* ---------------- drag ---------------- */
    function dragstart(event, d) { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; d.dragging = true; svg.style('cursor', 'grabbing'); }
    function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
    function dragend(event, d) { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; d.dragging = false; svg.style('cursor', 'grab'); }

    return () => { stopped = true; cancelAnimationFrame(raf); simulation.stop(); if (searchInput) searchInput.removeEventListener('input', onInput); };
  }, [projects]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setSelectedProject(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="garden relative h-[78vh] min-h-[600px] w-full overflow-hidden rounded-[1.75rem] border border-[#E7C9AE] shadow-[0_24px_70px_-30px_rgba(120,58,36,0.5)]">
      {/* sky + soil */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(#FFFCF5 0%, #FDF1E2 45%, #F6DEC8 78%, #EAC8A8 100%)' }} />
      {/* sun */}
      <div className="absolute left-1/2 top-[-90px] h-72 w-72 -translate-x-1/2 rounded-full opacity-60 blur-3xl" style={{ background: 'radial-gradient(circle, #FFE6C2 0%, transparent 70%)' }} />
      <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, #FFC099 0%, transparent 70%)' }} />
      {/* soil band */}
      <div className="absolute inset-x-0 bottom-0 h-40 opacity-50" style={{ background: 'linear-gradient(transparent, rgba(150,100,64,0.28))' }} />
      {/* grain */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-multiply"
           style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.7%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')" }} />

      <svg ref={ref} className="relative h-full w-full touch-none" />
      <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />

      <div className="pointer-events-none absolute left-5 top-5 select-none font-sans text-xs font-medium uppercase tracking-[0.18em] text-[#B08968]">
        Hover or tap a plant · drag · scroll to zoom
      </div>

      <div className="absolute bottom-5 right-5 rounded-2xl border border-[#EAD2BC] bg-white/80 px-4 py-3 font-sans text-xs text-[#7A5036] shadow-sm backdrop-blur-md">
        <div className="mb-1 font-semibold uppercase tracking-[0.12em] text-[#B08968]">Growth = how established</div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span>🌱</span><span>→</span><span>🌿</span><span>→</span><span>🪴</span><span>→</span><span>🌸</span><span>→</span><span>🌳</span>
        </div>
        <div className="mt-1 text-[10px] text-[#A0826A]">seed · sprout · bush · blooming · tree</div>
      </div>

      <style>{`
        .garden-overlay { background: rgba(72,38,20,0.42); backdrop-filter: blur(6px); animation: gardenFade .25s ease both; }
        .garden-card { animation: gardenPop .42s cubic-bezier(0.34,1.56,0.64,1) both; }
        @keyframes gardenFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes gardenPop { from { opacity: 0; transform: translateY(18px) scale(.96) } to { opacity: 1; transform: none } }
        @media (prefers-reduced-motion: reduce) { .garden-card, .garden-overlay { animation: none } }
      `}</style>
    </div>
  );
};

export default ProjectsVisualization;
