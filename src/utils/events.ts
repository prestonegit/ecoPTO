const EVENT_TIME_ZONE = 'America/New_York';

const EVENT_DAY_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: EVENT_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

type DateLike = Date | string | number;
type EventEntryLike = {
  data: {
    eventDate: DateLike;
  };
};

type GoogleCalendarEvent = {
  title: string;
  startDate: DateLike;
  endDate?: DateLike;
  description?: string;
  location?: string;
};

function asDate(value: DateLike): Date {
  return value instanceof Date ? value : new Date(value);
}

function formatGoogleCalendarDateTime(value: DateLike): string {
  return asDate(value)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

export function getEventDayKey(value: DateLike): string {
  const partMap = EVENT_DAY_FORMATTER
    .formatToParts(asDate(value))
    .reduce<Record<string, string>>((parts, part) => {
      if (part.type !== 'literal') {
        parts[part.type] = part.value;
      }

      return parts;
    }, {});

  return `${partMap.year}-${partMap.month}-${partMap.day}`;
}

export function isUpcomingEventDate(
  eventDate: DateLike,
  referenceDate: DateLike = new Date(),
): boolean {
  return getEventDayKey(eventDate) >= getEventDayKey(referenceDate);
}

export function sortByEventDateAscending<T extends EventEntryLike>(a: T, b: T): number {
  return asDate(a.data.eventDate).getTime() - asDate(b.data.eventDate).getTime();
}

export function sortByEventDateDescending<T extends EventEntryLike>(a: T, b: T): number {
  return asDate(b.data.eventDate).getTime() - asDate(a.data.eventDate).getTime();
}

export function getDefaultEventEndDate(startDate: DateLike, durationMinutes = 60): Date {
  return new Date(asDate(startDate).getTime() + durationMinutes * 60 * 1000);
}

export function buildGoogleCalendarUrl({
  title,
  startDate,
  endDate = getDefaultEventEndDate(startDate),
  description = '',
  location = '',
}: GoogleCalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatGoogleCalendarDateTime(startDate)}/${formatGoogleCalendarDateTime(endDate)}`,
    details: description,
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/([,;])/g, '\\$1');
}

// RFC 5545 caps lines at 75 octets; continuation lines start with a space.
function foldIcsLine(line: string): string {
  const out: string[] = [];
  let current = '';
  let bytes = 0;
  for (const char of line) {
    const size = new TextEncoder().encode(char).length;
    if (bytes + size > 75) {
      out.push(current);
      current = ' ';
      bytes = 1;
    }
    current += char;
    bytes += size;
  }
  out.push(current);
  return out.join('\r\n');
}

export function buildIcsFile({
  uid,
  title,
  startDate,
  endDate = getDefaultEventEndDate(startDate),
  description = '',
  location = '',
  url = '',
}: GoogleCalendarEvent & { uid: string; url?: string }): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ecoPTO//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatGoogleCalendarDateTime(new Date())}`,
    `DTSTART:${formatGoogleCalendarDateTime(startDate)}`,
    `DTEND:${formatGoogleCalendarDateTime(endDate)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    description && `DESCRIPTION:${escapeIcsText(description)}`,
    location && `LOCATION:${escapeIcsText(location)}`,
    url && `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean) as string[];

  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}
