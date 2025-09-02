import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const ProjectsVisualization = ({ projects }) => {
  const ref = useRef();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const svg = d3.select(ref.current);
    const width = svg.node().getBoundingClientRect().width;
    const height = 800;

    svg.attr('width', width).attr('height', height);

    const root = { id: 'ecopto', title: 'ecoPTO', isRoot: true };
    const nodes = [root, ...projects.map(p => ({ ...p, id: p.slug }))];
    const links = projects.map(p => ({ source: p.slug, target: 'ecopto' }));

    projects.forEach(p => {
      if (p.data.related_projects) {
        p.data.related_projects.forEach(related => {
          links.push({ source: p.slug, target: related });
        });
      }
    });

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-1500))
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
      .call(drag(simulation));

    node.append('circle')
      .attr('r', d => d.isRoot ? 50 : 30)
      .attr('fill', d => d.isRoot ? '#f97316' : '#3b82f6')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .on('mouseover', function (event, d) {
        d3.select(this).transition().duration(200).attr('r', d.isRoot ? 60 : 40);
      })
      .on('mouseout', function (event, d) {
        d3.select(this).transition().duration(200).attr('r', d.isRoot ? 50 : 30);
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
    searchInput.addEventListener('input', (e) => {
      setSearchQuery(e.target.value);
    });

    return () => {
      simulation.stop();
    };
  }, [projects]);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('g').style('opacity', d => {
        if (!searchQuery) return 1;
        const title = d.data?.title || d.title || '';
        return title.toLowerCase().includes(searchQuery.toLowerCase()) ? 1 : 0.1;
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

  return <svg ref={ref}></svg>;
};

export default ProjectsVisualization;
