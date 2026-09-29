// PROTOTYPE DATA for /circles.
//
// The projects collection is flat and no participant sits on two teams, so on its own it can't
// show the two things this page is about: circles nested inside circles, and the people who link
// them. Until the CMS schema grows `parent` / shared membership, this file layers sample sub-circles
// and cross-memberships on top of the real project entries. Everything here is illustrative.

// Sub-circles hung under each real project (keyed by project slug).
const SUB_CIRCLES = {
  'communications-team': [
    { id: 'newsletter', title: 'Newsletter', goal: 'Get the monthly issue out on time and worth opening.' },
    { id: 'website-social', title: 'Website & Social', goal: 'Keep ecopto.org and our social feeds current.' },
  ],
  'events-team': [
    { id: 'dance-nite', title: 'Dance Nite', goal: 'Put on the October dance at the Hopewell train station.' },
    { id: 'family-hikes', title: 'Family Hikes', goal: 'Lead monthly family hikes in local preserves.' },
    { id: 'fall-festival', title: 'Fall Festival', goal: 'Run the fall festival from set-up to clean-up.' },
  ],
  'fundraising-committee': [
    { id: 'restaurant-nights', title: 'Restaurant Nights', goal: 'Partner with local restaurants on give-back nights.' },
    { id: 'online-auction', title: 'Online Auction', goal: 'Source donations and run the spring auction.' },
  ],
  'garden-club': [
    { id: 'plant-sale', title: 'Plant Sale', goal: 'Grow and sell seedlings for the spring plant sale.' },
    { id: 'compost-crew', title: 'Compost Crew', goal: 'Keep the school compost bins turning.' },
  ],
  'green-team': [
    { id: 'recycling', title: 'Recycling', goal: 'Run cafeteria sorting and the recycling drives.' },
    { id: 'energy-watch', title: 'Energy Watch', goal: 'Students auditing lights, heat, and idle screens.' },
  ],
};

// Extra memberships, so some people sit in more than one circle: in sociocracy these are the
// double links that carry information between circles. Names match the real project entries.
const EXTRA_MEMBERSHIPS = {
  'Karen Miller': ['events-team', 'newsletter', 'dance-nite'],
  'Peter Jones': ['fundraising-committee', 'dance-nite'],
  'Mary Johnson': ['restaurant-nights'],
  'Jane Doe': ['green-team', 'compost-crew'],
  'Cynthia Green': ['garden-club', 'recycling'],
  'Michael Davis': ['website-social', 'family-hikes'],
  'Susan Williams': ['online-auction'],
  'Robert White': ['energy-watch', 'family-hikes'],
  'David Brown': ['plant-sale'],
  'John Smith': ['plant-sale'],
};

// Build the tree the page renders:
//   { id, title, goalHtml, descriptionHtml, keywords, people: [name], children: [...] }
// plus a people list: [{ name, circles: [id] }].
export function buildWorld(projects) {
  const members = new Map(); // circle id -> Set(name)
  const add = (id, name) => {
    if (!members.has(id)) members.set(id, new Set());
    members.get(id).add(name);
  };

  for (const p of projects) {
    for (const person of p.data.participants ?? []) add(p.slug, person.name);
  }
  for (const [name, ids] of Object.entries(EXTRA_MEMBERSHIPS)) for (const id of ids) add(id, name);

  const circle = (id, fields, children = []) => ({
    id,
    title: fields.title,
    goalHtml: fields.goalHtml ?? (fields.goal ? `<p>${fields.goal}</p>` : ''),
    descriptionHtml: fields.descriptionHtml ?? '',
    keywords: fields.keywords ?? [],
    people: [...(members.get(id) ?? [])],
    children,
  });

  const root = circle(
    'ecopto',
    {
      title: 'ecoPTO',
      goal: 'The general circle: where every team links back to the whole.',
    },
    projects.map((p) =>
      circle(
        p.slug,
        p.data,
        (SUB_CIRCLES[p.slug] ?? []).map((s) => circle(s.id, s)),
      ),
    ),
  );

  const people = new Map();
  for (const [id, names] of members) {
    for (const name of names) {
      if (!people.has(name)) people.set(name, []);
      people.get(name).push(id);
    }
  }

  return {
    root,
    people: [...people].map(([name, circles]) => ({ name, circles })),
  };
}
