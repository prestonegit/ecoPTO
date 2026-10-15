// Which upcoming events a YEWsletter issue shows. One rule, used by the send script,
// the CMS preview, the public archive, and the local preview — so what an editor sees
// is what subscribers get.
//
// Previously a flat "next 4". That let a newly added event silently push an earlier-
// announced one off the list (the Oct 31 Arboretum clean-up was dropped from the
// Oct 14 issue this way). A time window fits a monthly newsletter better: busy months
// show more, quiet months don't pad with far-off events.

export const WINDOW_DAYS = 42;   // ~6 weeks: covers the gap to the next monthly issue
export const MAX_EVENTS = 8;     // sanity cap so a very busy stretch stays readable
export const MIN_EVENTS = 2;     // quiet stretch: still show the next couple, even if later

/**
 * @param items  any array; `getDate(item)` must return the event date (Date | string)
 * @param now    the issue's reference time (send time, or now for previews)
 * @param onTruncate  optional; called with the events dropped by MAX_EVENTS
 */
export function selectNewsletterEvents(items, getDate, now = Date.now(), onTruncate) {
  const t = (x) => new Date(getDate(x)).getTime();
  const start = new Date(now).getTime();
  const end = start + WINDOW_DAYS * 86_400_000;

  const upcoming = items
    .filter((x) => Number.isFinite(t(x)) && t(x) >= start)
    .sort((a, b) => t(a) - t(b));

  const inWindow = upcoming.filter((x) => t(x) <= end);
  const chosen = inWindow.length >= MIN_EVENTS ? inWindow : upcoming.slice(0, MIN_EVENTS);
  // Report what the cap trims, so a busy stretch can't silently drop an event the way
  // the old "next 4" rule did.
  if (chosen.length > MAX_EVENTS && onTruncate) onTruncate(chosen.slice(MAX_EVENTS));
  return chosen.slice(0, MAX_EVENTS);
}
