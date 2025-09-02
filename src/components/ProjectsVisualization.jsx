import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const stopWords = new Set(['a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'did', 'do', 'does', 'doing', 'don', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'o', 'of', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 's', 'same', 'she', 'should', 'so', 'some', 'such', 't', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with', 'you', 'your', 'yours', 'yourself', 'yourselves']);

const getKeywords = (text) => {
  const words = text.toLowerCase().split(/\W+/);
  return words.filter(word => word.length > 2 && !stopWords.has(word));
};

const ProjectModal = ({ project, onClose }) => {
  if (!project) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full text-gray-800" onClick={e => e.stopPropagation()}>
        <h2 className="text-3xl font-bold mb-4">{project.data.title}</h2>
        <h3 className="text-xl font-semibold mb-2">Goal</h3>
        <p className="mb-4">{project.data.goal}</p>
        <h3 className="text-xl font-semibold mb-2">Description</h3>
        <div className="prose" dangerouslySetInnerHTML={{ __html: project.data.description }}></div>
        <h3 className="text-xl font-semibold mt-4 mb-2">Participants</h3>
        <ul>
          {project.data.participants.map(p => (
            <li key={p.name}>{p.name} - {p.contact}</li>
          ))}
        </ul>
        <button onClick={onClose} className="mt-6 bg-primary text-secondary font-bold py-2 px-4 rounded-lg hover:bg-secondary hover:text-primary transition-colors duration-300">Close</button>
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
    const width = svg.node().getBoundingClientRect().width;
    const height = 800;

    svg.attr('width', width).attr('height', height);

    const root = { id: 'ecopto', title: 'ecoPTO', isRoot: true };
    const nodes = [root, ...projects.map(p => ({ ...p, id: p.slug }))];
    
    const projectKeywords = projects.map(p => ({
      id: p.slug,
      keywords: new Set(getKeywords(p.data.goal + ' ' + p.data.description))
    }));

    const links = projects.map(p => ({ source: p.slug, target: 'ecopto' }));

    for (let i = 0; i < projectKeywords.length; i++) {
      for (let j = i + 1; j < projectKeywords.length; j++) {
        const keywords1 = projectKeywords[i].keywords;
        const keywords2 = projectKeywords[j].keywords;
        const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
        if (intersection.size >= 2) {
          links.push({ source: projectKeywords[i].id, target: projectKeywords[j].id });
        }
      }
    }

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-2000))
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
      .call(drag(simulation));

    node.append('circle')
      .attr('r', d => d.isRoot ? 60 : 40)
      .attr('fill', d => d.isRoot ? '#f97316' : '#3b82f6')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .on('mouseover', function (event, d) {
        d3.select(this).transition().duration(200).attr('r', d.isRoot ? 70 : 50);
      })
      .on('mouseout', function (event, d) {
        d3.select(this).transition().duration(200).attr('r', d.isRoot ? 60 : 40);
      });

    node.append('text')
      .attr('dy', '0.3em')
      .attr('text-anchor', 'middle')
      .text(d => d.data?.title || d.title)
      .attr('fill', 'white')
      .style('font-size', '12px');

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
        const textToSearch = (d.data?.title || '') + ' ' + (d.data?.goal || '') + ' ' + (d.data?.description || '');
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
      <svg ref={ref}></svg>
      <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
    </>
  );
};

export default ProjectsVisualization;