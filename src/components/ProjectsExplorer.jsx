import React, { useEffect, useState } from 'react';
import ProjectsVisualization from './ProjectsVisualization.jsx';
import ProjectsConstellation from './ProjectsConstellation.jsx';

/* The two visualizations are heavy; swapping them in place (or letting them
   overlap during a transition) can lock a software renderer. So each view is
   its own full page load — the toggle navigates to ?view=… with a hard reload,
   and only ever ONE visualization mounts per page, fresh and alone. The page's
   day/night theme follows the active view via the section's data-view attr. */
const ProjectsExplorer = ({ projects }) => {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState('garden');

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('view') === 'constellation' ? 'constellation' : 'garden';
    setView(v);
    const section = document.getElementById('projects-section');
    if (section) section.dataset.view = v;
    setMounted(true);
  }, []);

  const night = view === 'constellation';
  const go = (v) => {
    if (v === view) return;
    window.location.href = v === 'constellation' ? '/projects?view=constellation' : '/projects';
  };

  const seg = (active, world) =>
    `relative rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
      active
        ? world === 'garden'
          ? 'bg-primary text-white shadow'
          : 'bg-[#3A2A55] text-[#FFD27F] shadow ring-1 ring-[#FFD27F]/30'
        : night
          ? 'text-[#9A85B8] hover:text-[#FFD27F]'
          : 'text-[#8A6A52] hover:text-primary'
    }`;

  return (
    <div>
      <div className="mb-6 flex justify-center">
        <div className={`inline-flex items-center gap-1 rounded-full border p-1 shadow-sm backdrop-blur transition-colors duration-500 ${
          night ? 'border-white/10 bg-white/5' : 'border-[#E7C9AE] bg-white/70'
        }`}>
          <button type="button" onClick={() => go('garden')} className={seg(view === 'garden', 'garden')}>
            🌱 Living Garden
          </button>
          <button type="button" onClick={() => go('constellation')} className={seg(view === 'constellation', 'constellation')}>
            ✨ Constellation
          </button>
        </div>
      </div>

      {!mounted
        ? <div className="h-[78vh] min-h-[600px] w-full" aria-hidden="true" />
        : night
          ? <ProjectsConstellation projects={projects} />
          : <ProjectsVisualization projects={projects} />}
    </div>
  );
};

export default ProjectsExplorer;
