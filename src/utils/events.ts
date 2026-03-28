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

function asDate(value: DateLike): Date {
  return value instanceof Date ? value : new Date(value);
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
