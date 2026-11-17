export function formatRunDate(isoDate: string): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return isoDate;
  }
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(date);
}

export function getTomorrowIsoDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
