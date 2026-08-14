import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

/* ------------------------------------------------------------------ *
 *  The Constellation (orrery)
 *  Each team is a STAR that orbits ecoPTO at the centre — like a real
 *  system. A star's SIZE and number of light-rays scale with how many
 *  people are in the team; its colour is its "temperature." Bigger,
 *  brighter, spikier = more people.
 * ------------------------------------------------------------------ */

const GREEK = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π'];
const TINT_KEYS = ['amber', 'ice', 'gold', 'rose', 'white'];
const TINT = {
  ice:   { ring: '#BBD4FF', hot: '#FFFFFF' },
  white: { ring: '#FFE9C8', hot: '#FFFFFF' },
  gold:  { ring: '#FFD888', hot: '#FFF6DC' },
  amber: { ring: '#FFB066', hot: '#FFEFCE' },
  rose:  { ring: '#FF9E86', hot: '#FFF0EC' },
};

const memberCount = (data) => data.members ?? (data.participants ? data.participants.length : 1);

const StarModal = ({ project, onClose }) => {
  if (!project) return null;
  const d = project.data;
  const m = memberCount(d);
  return (
    <div className="sky-overlay fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="sky-card relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-[1.75rem] bg-[#1E1838] text-[#EDE3D2] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] ring-1 ring-[#FFD27F]/20" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-24 overflow-hidden rounded-t-[1.75rem]"
             style={{ background: 'radial-gradient(120% 160% at 25% 10%, #4A2E54 0%, #2A1E3F 55%, #1E1838 100%)' }}>
          <span className="absolute left-8 top-7 h-1 w-1 rounded-full bg-white/90 shadow-[0_0_6px_2px_rgba(255,225,180,0.8)]" />
          <span className="absolute left-20 top-12 h-1.5 w-1.5 rounded-full bg-[#FFD27F]/90 shadow-[0_0_8px_2px_rgba(255,210,127,0.7)]" />
          <span className="absolute right-14 top-8 h-1 w-1 rounded-full bg-white/80 shadow-[0_0_6px_2px_rgba(255,255,255,0.6)]" />
        </div>
        <button onClick={onClose}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-[#FFD9A8] ring-1 ring-white/15 backdrop-blur transition hover:scale-110 hover:bg-white/20"
          aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="px-8 pb-8 pt-6">
          <h2 className="font-serif text-3xl leading-tight text-[#FFD27F]">{d.title}</h2>
          <p className="mt-1 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[#B79B79]">{m} {m === 1 ? 'person' : 'people'}</p>
          {d.goal && (
            <p className="mt-3 border-l-2 border-[#FFD27F]/50 pl-4 font-serif text-lg italic leading-snug" style={{ color: '#E7CFA9' }}>{d.goal}</p>
          )}
          {d.description && (
            <p className="mt-5 font-sans text-[15px] leading-relaxed text-[#D9CDB8]">{d.description}</p>
          )}
          {d.participants && d.participants.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.18em] text-[#B79B79]">In this constellation</h3>
              <ul className="grid grid-cols-1 gap-2 font-sans text-[15px] text-[#D9CDB8] sm:grid-cols-2">
                {d.participants.map((p) => (
                  <li key={p.name} className="flex items-center gap-2.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FFE3B0] shadow-[0_0_6px_2px_rgba(255,210,127,0.7)]" />
                    <span>{p.name}</span>
                  </li>
                ))}
                {m > d.participants.length && (
                  <li className="flex items-center gap-2.5 text-[#A89372]"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FFE3B0]/50" /><span>+{m - d.participants.length} more</span></li>
                )}
              </ul>
            </div>
          )}
          {d.keywords && d.keywords.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {d.keywords.map((k) => (
                <span key={k} className="rounded-full border border-[#FFD27F]/30 bg-[#FFD27F]/10 px-3 py-1 font-sans text-xs font-semibold text-[#FFD9A8]">{k}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProjectsConstellation = ({ projects }) => {
  const ref = useRef();
  const searchRef = useRef('');
  const [selectedProject, setSelectedProject] = useState(null);
  const bare = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('bare');

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const width = 1000, height = 820, cx = width / 2, cy = height / 2;
    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('preserveAspectRatio', 'xMidYMid meet').style('cursor', 'grab');
    const gold = '#FFD27F';
    const rand = () => Math.random();

    /* ---------------- defs ---------------- */
    const defs = svg.append('defs');
    const radial = (id, stops, r = '50%') => {
      const g = defs.append('radialGradient').attr('id', id).attr('cx', '50%').attr('cy', '50%').attr('r', r);
      stops.forEach(([o, c]) => g.append('stop').attr('offset', o).attr('stop-color', c));
    };
    radial('tint-ice', [['0%', '#EAF3FF'], ['38%', '#B9D2FF'], ['100%', 'rgba(150,180,255,0)']]);
    radial('tint-white', [['0%', '#FFFEF8'], ['38%', '#FFE9C8'], ['100%', 'rgba(255,210,150,0)']]);
    radial('tint-gold', [['0%', '#FFFAE8'], ['38%', '#FFD27F'], ['100%', 'rgba(255,200,120,0)']]);
    radial('tint-amber', [['0%', '#FFEFD0'], ['38%', '#FFAE5A'], ['100%', 'rgba(255,150,80,0)']]);
    radial('tint-rose', [['0%', '#FFE9E4'], ['38%', '#FF9E86'], ['100%', 'rgba(255,140,120,0)']]);
    radial('root-glow', [['0%', 'rgba(255,228,180,0.7)'], ['45%', 'rgba(255,160,110,0.24)'], ['100%', 'rgba(255,160,110,0)']]);
    radial('milky', [['0%', 'rgba(255,242,224,0.20)'], ['55%', 'rgba(214,200,255,0.07)'], ['100%', 'rgba(214,200,255,0)']]);
    radial('neb-warm', [['0%', 'rgba(204,112,72,0.5)'], ['55%', 'rgba(204,112,72,0.12)'], ['100%', 'rgba(204,112,72,0)']]);
    radial('neb-rose', [['0%', 'rgba(222,128,158,0.42)'], ['100%', 'rgba(222,128,158,0)']]);
    radial('neb-violet', [['0%', 'rgba(132,92,184,0.44)'], ['100%', 'rgba(132,92,184,0)']]);
    radial('neb-teal', [['0%', 'rgba(92,150,180,0.32)'], ['100%', 'rgba(92,150,180,0)']]);

    const bar = (L, w) => `M0,${-L} L${w},0 L0,${L} L${-w},0 Z`;

    /* ---------------- teams (orbit ecoPTO) ---------------- */
    const teams = projects.map((p, i) => {
      const m = memberCount(p.data);
      return {
        id: p.slug, title: p.data.title, data: p.data, members: m,
        r: 6 + Math.sqrt(m) * 5,                                   // size scales with headcount
        bars: Math.max(2, Math.min(12, Math.round(m / 2))),        // ray-pairs scale with headcount
        tint: TINT_KEYS[i % TINT_KEYS.length],
        twPhase: rand() * 6.28, twSpeed: 0.8 + rand() * 1.0,
        bloom: 0, matched: true,
      };
    });
    // orbits: evenly distributed radii, golden-angle starting positions
    const N = teams.length, rMin = 178, rMax = 362;
    teams.forEach((tm, i) => {
      tm.orbitR = N > 1 ? rMin + (rMax - rMin) * (i / (N - 1)) : (rMin + rMax) / 2;
      tm.angle0 = i * 2.39996; // golden angle
      const period = 26 + (tm.orbitR - rMin) / (rMax - rMin) * 44; // inner orbits faster
      tm.omega = (2 * Math.PI) / period;
      // people orbiting this team (moons) — one per head
      tm.moonData = d3.range(tm.members).map(() => ({ a0: rand() * 6.28, r: tm.r * 1.6 + rand() * tm.r * 0.7, om: (0.4 + rand() * 0.5) * (rand() < 0.5 ? 1 : -1) }));
    });

    /* ---------------- zoom ---------------- */
    const g = svg.append('g');
    const zoom = d3.zoom().scaleExtent([0.35, 4]).on('zoom', (e) => g.attr('transform', e.transform));
    svg.call(zoom);
    const s0 = 0.92;
    svg.call(zoom.transform, d3.zoomIdentity.translate(width * (1 - s0) / 2, height * (1 - s0) / 2).scale(s0));

    /* ---------------- static backdrop ---------------- */
    if (!bare) {
      [['neb-warm', cx + 20, cy + 10, 430, 300, 0.7], ['neb-violet', 150, 660, 360, 280, 0.6], ['neb-rose', 760, 200, 300, 230, 0.5], ['neb-teal', 880, 560, 280, 210, 0.4], ['neb-warm', 80, 250, 250, 210, 0.45]].forEach(([id, x, y, rx, ry, op]) =>
        g.append('ellipse').attr('cx', x).attr('cy', y).attr('rx', rx).attr('ry', ry).attr('fill', `url(#${id})`).attr('opacity', op));
      g.append('ellipse').attr('cx', cx).attr('cy', cy).attr('rx', 980).attr('ry', 210).attr('transform', `rotate(-22 ${cx} ${cy})`).attr('fill', 'url(#milky)').attr('opacity', 0.78);
      const ang = (-22 * Math.PI) / 180, ca = Math.cos(ang), sa = Math.sin(ang);
      const stars = d3.range(130).map((i) => {
        let x, y;
        if (i < 48) { const al = -780 + rand() * 1560, pe = (rand() - 0.5) * 230; x = cx + al * ca - pe * sa; y = cy + al * sa + pe * ca; }
        else { x = -200 + rand() * (width + 400); y = -150 + rand() * (height + 300); }
        return { x, y, r: 0.35 + rand() * 1.7, o: 0.22 + rand() * 0.6 };
      });
      g.append('g').selectAll('circle').data(stars).join('circle').attr('cx', (d) => d.x).attr('cy', (d) => d.y).attr('r', (d) => d.r)
        .attr('fill', () => (rand() < 0.16 ? '#FFD9A8' : '#FFF6E8')).attr('opacity', (d) => d.o);
    }

    /* ---------------- orbit rings ---------------- */
    const ringG = g.append('g').attr('class', 'orbits');
    teams.forEach((tm) => ringG.append('circle').attr('cx', cx).attr('cy', cy).attr('r', tm.orbitR)
      .attr('fill', 'none').attr('stroke', 'rgba(255,226,184,0.10)').attr('stroke-width', 1).attr('stroke-dasharray', '2 7'));

    /* ---------------- spokes (centre → each star) ---------------- */
    const spoke = g.append('g').attr('class', 'spokes').selectAll('line').data(teams).join('line')
      .attr('stroke', 'rgba(255,226,184,0.16)').attr('stroke-width', 1);

    /* ---------------- ecoPTO galaxy at the centre ---------------- */
    const ecoR = 46;
    const ecoNode = g.append('g').attr('class', 'eco').attr('transform', `translate(${cx},${cy})`);
    (() => {
      const gal = ecoNode.append('g').attr('transform', 'rotate(20)');
      gal.append('ellipse').attr('rx', ecoR * 2.5).attr('ry', ecoR * 1.15).attr('fill', 'url(#root-glow)').attr('opacity', 0.5);
      const arm = (off, col) => {
        for (let a = 0.5; a < 3 * Math.PI; a += 0.34) {
          const rad = ecoR * 0.32 * Math.exp(0.235 * a); if (rad > ecoR * 2.5) break;
          const t = a / (3 * Math.PI);
          gal.append('circle').attr('cx', Math.cos(a + off) * rad).attr('cy', Math.sin(a + off) * rad * 0.52)
            .attr('r', Math.max(0.6, ecoR * 0.14 * (1 - t))).attr('fill', col).attr('opacity', 0.85 * (1 - t * 0.8));
        }
      };
      arm(0, '#FFEAC8'); arm(Math.PI, '#FFD9B6');
      gal.append('ellipse').attr('rx', ecoR * 0.95).attr('ry', ecoR * 0.6).attr('fill', 'url(#tint-white)');
      gal.append('circle').attr('r', ecoR * 0.5).attr('fill', '#FFF3D6');
      gal.append('circle').attr('r', ecoR * 0.24).attr('fill', '#FFFFFF');
      ecoNode.append('text').text('ecoPTO').attr('text-anchor', 'middle').attr('y', ecoR * 1.5 + 6)
        .style('font-family', 'var(--font-serif)').style('font-weight', '700').style('font-size', '22px').style('fill', '#FFE6BE').style('pointer-events', 'none').style('text-shadow', '0 0 12px rgba(255,200,130,0.6)');
    })();

    /* ---------------- team stars ---------------- */
    const drawStar = (star, tm) => {
      const r = tm.r, tint = `url(#tint-${tm.tint})`, cfg = TINT[tm.tint] || TINT.gold;
      star.append('circle').attr('class', 'glow').attr('r', r * 1.9).attr('fill', tint).attr('opacity', 0.82);
      if (tm.members >= 10) star.append('circle').attr('r', r * 1.55).attr('fill', 'none').attr('stroke', cfg.ring).attr('stroke-width', 1).attr('opacity', 0.22);
      const w = Math.max(0.45, r * 0.05), L = r * 2.1;
      for (let i = 0; i < tm.bars; i++)
        star.append('path').attr('class', 'spike').attr('d', bar(L, w)).attr('transform', `rotate(${(i * 180) / tm.bars})`).attr('fill', tint).attr('opacity', 0.94);
      star.append('circle').attr('r', r * 0.72).attr('fill', tint);
      star.append('circle').attr('r', r * 0.34).attr('fill', cfg.hot);
    };

    const node = g.append('g').attr('class', 'stars').selectAll('g.team').data(teams).join('g').attr('class', 'team');
    node.each(function (tm) {
      const el = d3.select(this);
      const star = el.append('g').attr('class', 'star');
      drawStar(star, tm);
      const lab = el.append('text').attr('class', 'nlabel').attr('text-anchor', 'middle').attr('y', tm.r + 18)
        .style('font-family', 'var(--font-serif)').style('font-weight', '600').style('font-size', '14px').style('fill', '#EFE2CC').style('pointer-events', 'none').style('text-shadow', '0 0 8px rgba(0,0,0,0.7)');
      lab.append('tspan').style('fill', gold).style('font-style', 'italic').style('font-size', '13px').text(tm.bayer ? tm.bayer + '  ' : '');
      lab.append('tspan').text(tm.title);
      el.append('circle').attr('class', 'hit').attr('r', tm.r + 16).attr('fill', 'transparent').style('cursor', 'pointer')
        .on('mouseover', () => highlight(tm)).on('mouseout', () => unhighlight())
        .on('click', (e) => { e.stopPropagation(); setSelectedProject(tm); });
    });

    /* ---------------- highlight / search ---------------- */
    function highlight(tm) {
      tm.bloom = 1;
      if (searchRef.current.trim()) return;
      node.style('opacity', (n) => (n === tm ? 1 : 0.18));
      spoke.style('opacity', (n) => (n === tm ? 1 : 0.12)).attr('stroke', (n) => (n === tm ? gold : 'rgba(255,226,184,0.16)'));
    }
    function unhighlight() { teams.forEach((t) => (t.bloom = 0)); applyFilter(); }

    const matchNode = (tm, q) => tm.title.toLowerCase().includes(q) || (tm.data.goal || '').toLowerCase().includes(q) || (tm.data.description || '').toLowerCase().includes(q) || (tm.data.keywords || []).some((k) => k.toLowerCase().includes(q));
    function applyFilter() {
      const q = searchRef.current.trim().toLowerCase();
      node.each((tm) => { tm.matched = q ? matchNode(tm, q) : true; });
      node.style('opacity', (tm) => (tm.matched ? 1 : 0.1));
      spoke.style('opacity', (tm) => (tm.matched ? 1 : 0.04)).attr('stroke', 'rgba(255,226,184,0.16)');
    }
    const searchInput = document.getElementById('search');
    const onInput = (e) => { searchRef.current = e.target.value; applyFilter(); };
    if (searchInput) searchInput.addEventListener('input', onInput);

    /* ---------------- render loop (orbital motion) ---------------- */
    const starSel = node.select('.star');
    function positionAt(t) {
      node.attr('transform', (tm) => {
        const a = tm.angle0 + tm.omega * t;
        tm.px = cx + Math.cos(a) * tm.orbitR; tm.py = cy + Math.sin(a) * tm.orbitR;
        return `translate(${tm.px},${tm.py})`;
      });
      starSel.style('opacity', (tm) => 0.78 + 0.22 * Math.sin(t * tm.twSpeed + tm.twPhase));
      spoke.attr('x1', cx).attr('y1', cy).attr('x2', (tm) => tm.px).attr('y2', (tm) => tm.py);
    }
    positionAt(0); // initial layout — robust even before the first animation frame

    const t0 = performance.now();
    let raf = null, stopped = false;
    function frame(now) {
      if (stopped) return;
      positionAt((now - t0) / 1000);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => { stopped = true; cancelAnimationFrame(raf); if (searchInput) searchInput.removeEventListener('input', onInput); };
  }, [projects]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setSelectedProject(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="sky relative h-[78vh] min-h-[600px] w-full overflow-hidden rounded-[1.75rem] border border-[#3A2C52] shadow-[0_24px_70px_-30px_rgba(0,0,0,0.7)]">
      <div className="absolute inset-0" style={{ background: bare ? '#16111F' : [
        'radial-gradient(40% 30% at 50% 44%, rgba(196,106,66,0.42) 0%, transparent 70%)',
        'radial-gradient(30% 24% at 80% 14%, rgba(255,170,110,0.30) 0%, transparent 72%)',
        'radial-gradient(26% 30% at 16% 28%, rgba(216,120,150,0.22) 0%, transparent 72%)',
        'radial-gradient(30% 34% at 6% 98%, rgba(124,86,170,0.34) 0%, transparent 72%)',
        'radial-gradient(24% 22% at 92% 72%, rgba(92,142,172,0.20) 0%, transparent 72%)',
        'radial-gradient(22% 20% at 66% 86%, rgba(255,142,92,0.18) 0%, transparent 72%)',
        'radial-gradient(130% 95% at 50% 4%, #2E2452 0%, #241B3E 45%, #140E1E 100%)',
      ].join(', ') }} />

      <svg ref={ref} className="relative h-full w-full touch-none" />
      <StarModal project={selectedProject} onClose={() => setSelectedProject(null)} />

      <div className="pointer-events-none absolute left-5 top-5 select-none font-sans text-xs font-medium uppercase tracking-[0.18em] text-[#9A85B8]">
        Teams orbit ecoPTO · hover a star · drag · scroll to zoom
      </div>

      <div className="absolute bottom-5 right-5 rounded-2xl border border-white/10 bg-[#241B3E]/85 px-4 py-3 font-sans text-xs text-[#C9B89A] shadow-sm">
        <div className="mb-1 font-semibold uppercase tracking-[0.12em] text-[#9A85B8]">Size &amp; rays = team headcount</div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#FFE9C0]" /><span className="text-[11px]">few</span></span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#FFE3A6] shadow-[0_0_8px_3px_rgba(255,210,127,0.7)]" /><span className="text-[11px]">many</span></span>
          <span className="text-[10px] text-[#9A85B8]">· colour = team</span>
        </div>
      </div>

      <style>{`
        .sky-overlay { background: rgba(10,6,20,0.6); backdrop-filter: blur(6px); animation: skyFade .25s ease both; }
        .sky-card { animation: skyPop .42s cubic-bezier(0.34,1.56,0.64,1) both; }
        @keyframes skyFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes skyPop { from { opacity: 0; transform: translateY(18px) scale(.96) } to { opacity: 1; transform: none } }
        @media (prefers-reduced-motion: reduce) { .sky-card, .sky-overlay { animation: none } }
      `}</style>
    </div>
  );
};

export default ProjectsConstellation;
