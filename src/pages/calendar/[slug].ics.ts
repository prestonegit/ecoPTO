import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildIcsFile } from '../../utils/events';

// One downloadable .ics per event, for Apple Calendar, Outlook and anything else
// that isn't Google. Built statically alongside the event pages.
export async function getStaticPaths() {
  const events = await getCollection('events');
  return events
    .filter(event => !event.data.externalUrl)
    .map(event => ({ params: { slug: event.id }, props: { event } }));
}

export const GET: APIRoute = ({ props, site }) => {
  const { event } = props as any;
  const pageUrl = site ? new URL(`/events/${event.id}`, site).toString() : '';
  const body = buildIcsFile({
    uid: `${event.id}@ecopto.org`,
    title: event.data.title,
    startDate: event.data.eventDate,
    description: event.data.description,
    location: event.data.location,
    url: pageUrl,
  });
  return new Response(body, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
};
