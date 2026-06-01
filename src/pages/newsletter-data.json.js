import { getCollection } from 'astro:content';

export async function GET() {
  const events = await getCollection('events');
  const news = await getCollection('news');
  const now = Date.now();

  const upcomingEvents = events
    .filter(e => new Date(e.data.eventDate).getTime() >= now)
    .sort((a, b) => new Date(a.data.eventDate) - new Date(b.data.eventDate))
    .slice(0, 4)
    .map(e => ({
      slug: e.slug,
      title: e.data.title,
      eventDate: e.data.eventDate,
      dateOverride: e.data.dateOverride ?? null,
      location: e.data.location ?? null,
      cardDescription: e.data.cardDescription ?? e.data.description ?? '',
      image: e.data.image ?? null,
      externalUrl: e.data.externalUrl ?? null,
    }));

  const latestNews = [...news]
    .sort((a, b) => new Date(b.data.pubDate) - new Date(a.data.pubDate))
    .slice(0, 3)
    .map(n => ({
      slug: n.slug,
      title: n.data.title,
      author: n.data.author,
      pubDate: n.data.pubDate,
      description: n.data.description ?? '',
    }));

  return new Response(JSON.stringify({ events: upcomingEvents, news: latestNews }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
