// Collapsible headings for the admin sidebar.
//
// Decap has no concept of collection groups — there is no `collection_groups` key in its
// config schema, and the sidebar is a flat <ul> of every collection. With thirteen of them
// that's a wall of links where "Events" sits at the same visual weight as "Global
// settings". So this groups them after the fact.
//
// The groups below must stay CONTIGUOUS in the order collections are declared in
// config.js, because this only inserts a heading before each group's first link — it never
// reorders React's own nodes, which is the part that would actually be fragile. If you add
// a collection, add its name here next to its neighbours and keep config.js in the same
// order.
export const SIDEBAR_GROUPS = [
  { label: 'Newsletter', collections: ['newsletters'] },
  { label: 'Forms', collections: ['signup'] },
  { label: 'Pages', collections: ['about-us', 'impact-page', 'research-page', 'pages'] },
  {
    label: 'Content',
    collections: ['events', 'get-involved', 'leaders', 'news', 'projects', 'transparency'],
  },
  { label: 'Settings', collections: ['settings'] },
];

const STORE_KEY = 'ecopto-cms-collapsed-groups';
const LIST_SELECTOR = '[class*="-SidebarNavList"]';

const loadCollapsed = () => {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};

const saveCollapsed = (set) => {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify([...set]));
  } catch {
    /* private browsing, or storage full — collapsing still works for this session */
  }
};

const collectionOf = (li) => {
  const a = li.querySelector('a[href]');
  const m = a && a.getAttribute('href').match(/#\/collections\/([^/?]+)/);
  return m ? m[1] : null;
};

const headingStyle = `
  display: flex; align-items: center; gap: 6px; width: calc(100% - 12px);
  margin: 10px 6px 2px; padding: 4px 6px; background: none; border: 0;
  font: 600 11px/1.2 'Plus Jakarta Sans', -apple-system, sans-serif;
  letter-spacing: 0.07em; text-transform: uppercase; color: #6b5d54;
  cursor: pointer; text-align: left; border-radius: 6px;
`;

function buildHeading(group, collapsed, onToggle) {
  const li = document.createElement('li');
  li.setAttribute('data-cms-group', group.label);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('style', headingStyle);
  btn.setAttribute('aria-expanded', String(!collapsed));

  const caret = document.createElement('span');
  caret.textContent = '▾';
  caret.setAttribute(
    'style',
    `display:inline-block; transition: transform .15s ease; transform: rotate(${collapsed ? -90 : 0}deg);`,
  );

  const text = document.createElement('span');
  text.textContent = group.label;

  btn.append(caret, text);
  btn.addEventListener('click', () => onToggle(group.label));
  li.append(btn);
  return li;
}

// Returns a teardown function.
export function installSidebarGroups() {
  if (typeof document === 'undefined') return () => {};
  let observer = null;
  const collapsed = loadCollapsed();

  const toggle = (label) => {
    if (collapsed.has(label)) collapsed.delete(label);
    else collapsed.add(label);
    saveCollapsed(collapsed);
    apply();
  };

  function apply() {
    const list = document.querySelector(LIST_SELECTOR);
    if (!list) return;

    // Pause observation: everything below mutates the very tree being watched, which
    // would otherwise re-enter apply() on every insertion.
    if (observer) observer.disconnect();

    try {
      // Drop stale headings first, so a re-render that reordered things can't leave two.
      list.querySelectorAll('[data-cms-group]').forEach((el) => el.remove());

      const items = [...list.children].filter((li) => !li.hasAttribute('data-cms-group'));
      const byCollection = new Map();
      items.forEach((li) => {
        const name = collectionOf(li);
        if (name) byCollection.set(name, li);
      });

      SIDEBAR_GROUPS.forEach((group) => {
        const members = group.collections.map((n) => byCollection.get(n)).filter(Boolean);
        if (members.length === 0) return;
        const isCollapsed = collapsed.has(group.label);
        list.insertBefore(buildHeading(group, isCollapsed, toggle), members[0]);
        members.forEach((li) => {
          // A collapsed group still shows the collection you're currently looking at —
          // hiding the active link would make the sidebar contradict the main pane.
          const active = li.querySelector('.sidebar-active');
          li.style.display = isCollapsed && !active ? 'none' : '';
        });
      });
    } finally {
      if (observer) observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  // Decap rebuilds the sidebar on navigation, discarding the headings, so re-apply on any
  // change to the tree rather than only once at startup.
  observer = new MutationObserver(() => apply());
  observer.observe(document.body, { childList: true, subtree: true });
  apply();

  return () => {
    if (observer) observer.disconnect();
    document.querySelectorAll('[data-cms-group]').forEach((el) => el.remove());
  };
}

export default installSidebarGroups;
