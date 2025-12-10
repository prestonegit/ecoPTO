import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const ProjectModal = ({ project, onClose }) => {
  if (!project) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full text-gray-800 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-3xl font-bold mb-4 font-sans text-primary">{project.data.title}</h2>
        <h3 className="text-xl font-semibold mb-2 font-sans">Goal</h3>
        <p className="mb-4 font-sans">{project.data.goal}</p>
        <h3 className="text-xl font-semibold mb-2 font-sans">Description</h3>
        <div className="prose font-sans mb-6" dangerouslySetInnerHTML={{ __html: project.data.description }}></div>

        {project.data.participants && project.data.participants.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2 font-sans">Team Members</h3>
            <ul className="font-sans grid grid-cols-1 sm:grid-cols-2 gap-2">
              {project.data.participants.map(p => (
                <li key={p.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  <span>{p.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {project.data.keywords && project.data.keywords.length > 0 && (
          <>
            <h3 className="text-xl font-semibold mb-2 font-sans">Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {project.data.keywords.map(keyword => (
                <span key={keyword} className="bg-gray-100 rounded-full px-3 py-1 text-sm font-semibold text-gray-600 border border-gray-200">{keyword}</span>
              ))}
            </div>
          </>
        )}
        <div className="mt-8 flex justify-end">
          <button onClick={onClose} className="btn-standard btn-text-secondary-color rounded-lg">CLOSE</button>
        </div>
      </div>
    </div>
  );
};

const ProjectsVisualization = ({ projects }) => {
  const ref = useRef();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove(); // Clear previous render

    // Setup dimensions
    const width = 1000;
    const height = 800;

    svg.attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('cursor', 'grab');

    // Get computed styles for branding
    const computedStyle = getComputedStyle(document.documentElement);
    const primaryColor = computedStyle.getPropertyValue('--primary').trim() || '#ea580c';
    const secondaryColor = computedStyle.getPropertyValue('--secondary').trim() || '#14b8a6';

    // 1. Process Data
    const rootNode = { id: 'ecopto', title: 'ecoPTO', type: 'root', r: 50 };

    const projectNodes = projects.map(p => ({
      id: p.slug,
      title: p.data.title,
      data: p.data,
      type: 'project',
      r: 45 // Slightly larger for better text fit
    }));

    const peopleMap = new Map();
    projects.forEach(p => {
      if (p.data.participants) {
        p.data.participants.forEach(participant => {
          if (!peopleMap.has(participant.name)) {
            peopleMap.set(participant.name, {
              id: `person-${participant.name.replace(/\s+/g, '-').toLowerCase()}`,
              name: participant.name,
              type: 'person',
              r: 15,
              projects: []
            });
          }
          peopleMap.get(participant.name).projects.push(p.slug);
        });
      }
    });
    const personNodes = Array.from(peopleMap.values());
    const nodes = [rootNode, ...projectNodes, ...personNodes];
    const links = [];

    projectNodes.forEach(p => {
      links.push({ source: 'ecopto', target: p.id, type: 'structure', distance: 220 });
    });

    personNodes.forEach(person => {
      person.projects.forEach(projSlug => {
        links.push({ source: person.id, target: projSlug, type: 'membership', distance: 70 });
      });
    });

    // 2. Define Simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(d => d.distance))
      .force('charge', d3.forceManyBody().strength(d => d.type === 'root' ? -800 : (d.type === 'project' ? -400 : -100)))
      .force('collide', d3.forceCollide().radius(d => d.r + 15).iterations(2))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // 3. Render Elements with Zoom Support
    const g = svg.append('g'); // Container for zoomable content

    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Initial Zoom Out slightly to ensure fit
    const initialScale = 0.85;
    svg.call(zoom.transform, d3.zoomIdentity.translate(width * (1 - initialScale) / 2, height * (1 - initialScale) / 2).scale(initialScale));


    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const createGradient = (id, color1, color2) => {
      const grd = defs.append('radialGradient').attr('id', id).attr('cx', '30%').attr('cy', '30%');
      grd.append('stop').attr('offset', '0%').attr('stop-color', color1);
      grd.append('stop').attr('offset', '100%').attr('stop-color', color2);
    };
    createGradient('root-grad', '#fb923c', '#ea580c');

    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => d.type === 'structure' ? '#ddd' : '#94a3b8')
      .attr('stroke-opacity', d => d.type === 'structure' ? 0.3 : 0.6)
      .attr('stroke-width', d => d.type === 'structure' ? 1 : 1.5);

    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    node.each(function (d) {
      const el = d3.select(this);

      if (d.type === 'root') {
        el.append('circle')
          .attr('r', d.r)
          .attr('fill', 'url(#root-grad)')
          .style('filter', 'url(#glow)');

        el.append('text')
          .text('ecoPTO')
          .attr('text-anchor', 'middle')
          .attr('dy', '0.35em')
          .style('font-family', 'var(--font-sans)')
          .style('font-weight', 'bold')
          .style('fill', 'white')
          .style('font-size', '20px');

      } else if (d.type === 'project') {
        el.append('circle')
          .attr('r', d.r)
          .attr('fill', primaryColor)
          .attr('fill-opacity', 0.95)
          .attr('stroke', '#fff')
          .attr('stroke-width', 2)
          .style('cursor', 'pointer')
          .on('mouseover', function () {
            d3.select(this).transition().duration(200).attr('transform', 'scale(1.05)');
          })
          .on('mouseout', function () {
            d3.select(this).transition().duration(200).attr('transform', 'scale(1)');
          })
          .on('click', (e, d) => {
            if (e.defaultPrevented) return; // Click supressed by drag
            e.stopPropagation();
            setSelectedProject(d);
          });

        // Project Label - Improved logic for fitting
        // Expanding width beyond radius to allow overflow checking or just better centering
        const width = d.r * 2.5;
        el.append('foreignObject')
          .attr('x', -width / 2)
          .attr('y', -d.r)
          .attr('width', width)
          .attr('height', d.r * 2)
          .style('pointer-events', 'none')
          .html(`
                <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; text-align: center; color: white; font-family: var(--font-sans); font-size: ${Math.max(10, d.r / 3.8)}px; line-height: 1.1; font-weight: 600; padding: 2px;">
                    ${d.title}
                </div>
             `);

      } else if (d.type === 'person') {
        el.append('circle')
          .attr('r', d.r)
          .attr('fill', secondaryColor)
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.5)
          .style('filter', 'url(#glow)');

        el.append('text')
          .text(d.name)
          .attr('text-anchor', 'middle')
          .attr('y', d.r + 12)
          .style('font-family', 'var(--font-sans)')
          .style('font-size', '9px')
          .style('fill', '#64748b')
          .style('pointer-events', 'none')
          .attr('stroke', 'none');
      }
    });

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    const searchInput = document.getElementById('search');
    const handleInput = (e) => setSearchQuery(e.target.value);
    if (searchInput) searchInput.addEventListener('input', handleInput);

    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
      svg.style('cursor', 'grabbing');
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
      svg.style('cursor', 'grab');
    }

    return () => {
      simulation.stop();
      if (searchInput) searchInput.removeEventListener('input', handleInput);
    };

  }, [projects]);

  // Filter effect for search
  useEffect(() => {
    const svg = d3.select(ref.current);
    const nodes = svg.selectAll('.nodes g');
    const links = svg.selectAll('.links line');

    if (!searchQuery) {
      nodes.transition().duration(200).style('opacity', 1);
      links.transition().duration(200).style('opacity', d => d.type === 'structure' ? 0.3 : 0.6);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();

    // Determine matches
    nodes.each(function (d) {
      let match = false;
      if (d.type === 'project') {
        match = d.title.toLowerCase().includes(lowerQuery) ||
          (d.data.description && d.data.description.toLowerCase().includes(lowerQuery)) ||
          (d.data.keywords && d.data.keywords.some(k => k.toLowerCase().includes(lowerQuery)));
      } else if (d.type === 'person') {
        match = d.name.toLowerCase().includes(lowerQuery);
      } else if (d.type === 'root') {
        match = true;
      }
      d.matched = match;
    });

    nodes.transition().duration(200).style('opacity', d => d.matched ? 1 : 0.1);
    links.transition().duration(200).style('opacity', d => {
      if (d.source.matched && d.target.matched) return 0.6;
      return 0.05;
    });

  }, [searchQuery]);


  return (
    <div className="w-full aspect-square md:aspect-video relative bg-slate-50 rounded-xl overflow-hidden shadow-inner border border-slate-200">
      <svg ref={ref} className="w-full h-full touch-none"></svg>
      <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />

      <div className="absolute top-4 left-4 text-xs font-sans text-slate-400 pointer-events-none select-none">
        Scroll to Zoom • Drag to Pan
      </div>

      <div className="absolute bottom-4 right-4 text-xs text-slate-400 bg-white/90 p-2 rounded backdrop-blur-md shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full bg-[var(--primary)] opacity-90"></span> Project
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[var(--secondary)]"></span> Team Member
        </div>
      </div>
    </div>
  );
};

export default ProjectsVisualization;
