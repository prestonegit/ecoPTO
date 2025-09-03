import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const ProjectModal = ({ project, onClose }) => {
  if (!project) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full text-gray-800" onClick={e => e.stopPropagation()}>
        <h2 className="text-3xl font-bold mb-4 font-sans">{project.data.title}</h2>
        <h3 className="text-xl font-semibold mb-2 font-sans">Goal</h3>
        <p className="mb-4 font-sans">{project.data.goal}</p>
        <h3 className="text-xl font-semibold mb-2 font-sans">Description</h3>
        <div className="prose font-sans" dangerouslySetInnerHTML={{ __html: project.data.description }}></div>
        <h3 className="text-xl font-semibold mt-4 mb-2 font-sans">Participants</h3>
        <ul className="font-sans">
          {project.data.participants.map(p => (
            <li key={p.name}>{p.name} - {p.contact}</li>
          ))}
        </ul>
        {project.data.keywords && project.data.keywords.length > 0 && (
          <>
            <h3 className="text-xl font-semibold mt-4 mb-2 font-sans">Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {project.data.keywords.map(keyword => (
                <span key={keyword} className="bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700">{keyword}</span>
              ))}
            </div>
          </>
        )}
        <button onClick={onClose} className="mt-6 btn-standard btn-text-secondary-color rounded-lg">CLOSE</button>
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
    const container = svg.node().parentElement;
    if (!container) return;
    const width = 800; // Fixed width
    const height = 800; // Fixed height

    svg.attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    // Get computed styles for CSS variables
    const computedStyle = getComputedStyle(document.documentElement);
    const primaryColor = computedStyle.getPropertyValue('--primary').trim();
    const secondaryColor = computedStyle.getPropertyValue('--secondary').trim();
    const sansFont = computedStyle.getPropertyValue('--font-sans').trim();

    const root = { id: 'ecopto', title: 'ecoPTO', isRoot: true };
    const nodes = [root, ...projects.map(p => ({ ...p, id: p.slug }))];
    
    const links = projects.map(p => ({ source: p.slug, target: 'ecopto' }));

    for (let i = 0; i < projects.length; i++) {
      for (let j = i + 1; j < projects.length; j++) {
        const keywords1 = new Set(projects[i].data.keywords || []);
        const keywords2 = new Set(projects[j].data.keywords || []);
        const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
        if (intersection.size > 0) {
          links.push({ source: projects[i].slug, target: projects[j].slug });
        }
      }
    }

    const memberCounts = projects.map(p => p.data.members || 1);
    const radiusScale = d3.scaleSqrt()
      .domain([d3.min(memberCounts), d3.max(memberCounts)])
      .range([50, 100]);

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(d => (radiusScale(d.source.data?.members || 1) || 70) + (radiusScale(d.target.data?.members || 1) || 70) + 50))
      .force('charge', d3.forceManyBody().strength(-3000))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6);

    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'cursor-pointer')
      .on('click', (event, d) => {
        if (!d.isRoot) {
          setSelectedProject(d);
        }
      })
      .call(d3.drag(simulation));

    const defs = svg.append('defs');
    const gradient = defs.append('radialGradient')
      .attr('id', 'circle-gradient')
      .attr('cx', '30%')
      .attr('cy', '30%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', secondaryColor);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', primaryColor);

    const rootGradient = defs.append('radialGradient')
      .attr('id', 'root-gradient')
      .attr('cx', '30%')
      .attr('cy', '30%');
    rootGradient.append('stop').attr('offset', '0%').attr('stop-color', '#f97316');
    rootGradient.append('stop').attr('offset', '100%').attr('stop-color', '#ea580c');

    const filter = defs.append('filter')
      .attr('id', 'drop-shadow')
      .attr('height', '130%');
    filter.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', 3)
      .attr('result', 'blur');
    filter.append('feOffset')
      .attr('in', 'blur')
      .attr('dx', 3)
      .attr('dy', 3)
      .attr('result', 'offsetBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'offsetBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    node.append('circle')
      .attr('r', d => d.isRoot ? 90 : radiusScale(d.data.members || 1))
      .attr('fill', d => d.isRoot ? 'url(#root-gradient)' : 'url(#circle-gradient)')
      .style('filter', 'url(#drop-shadow)')
      .on('mouseover', function (event, d) {
        d3.select(this).transition().duration(200).attr('r', (d.isRoot ? 90 : radiusScale(d.data.members || 1)) + 10);
      })
      .on('mouseout', function (event, d) {
        d3.select(this).transition().duration(200).attr('r', d.isRoot ? 90 : radiusScale(d.data.members || 1));
      });

    node.append('foreignObject')
        .attr('x', d => -(radiusScale(d.data?.members || 1) * 0.8) || -60)
        .attr('y', d => -(radiusScale(d.data?.members || 1) * 0.4) || -30)
        .attr('width', d => (radiusScale(d.data?.members || 1) * 1.6) || 120)
        .attr('height', d => (radiusScale(d.data?.members || 1) * 0.8) || 60)
        .append('xhtml:div')
        .style('font-size', d => `${(radiusScale(d.data?.members || 1) || 70) / 6}px`)
        .style('font-weight', 'bold')
        .style('color', 'white')
        .style('display', 'flex')
        .style('justify-content', 'center')
        .style('align-items', 'center')
        .style('height', '100%')
        .style('text-align', 'center')
        .style('word-wrap', 'break-word')
        .html(d => d.data?.title || d.title);

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
    const inputHandler = (e) => {
      setSearchQuery(e.target.value);
    };
    searchInput.addEventListener('input', inputHandler);

    return () => {
      simulation.stop();
      searchInput.removeEventListener('input', inputHandler);
    };
  }, [projects]);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('g').style('opacity', d => {
        if (!searchQuery) return 1;
        const textToSearch = d.isRoot ? d.title : (d.data?.title || '') + ' ' + (d.data?.goal || '') + ' ' + (d.data?.description || '') + ' ' + (d.data?.keywords?.join(' ') || '');
        return textToSearch.toLowerCase().includes(searchQuery.toLowerCase()) ? 1 : 0.1;
    });
  }, [searchQuery]);

  const drag = (simulation) => {
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  return (
    <>
      <svg ref={ref} style={{ width: '100%' }}></svg>
      <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
    </>
  );
};

export default ProjectsVisualization;
