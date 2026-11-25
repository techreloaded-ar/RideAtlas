// Formattazione per l'interfaccia dei viaggi guidati. Le date sono giorni di calendario
// salvati a mezzanotte UTC: vanno sempre mostrate in UTC per non slittare di un giorno.

const calendarFormat = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('it-IT', { timeZone: 'UTC', ...options });

export function formatEuro(amount: number): string {
  return amount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: Number.isInteger(amount) ? 0 : 2 });
}

export function formatLongDate(isoDate: string): string {
  return calendarFormat({ weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(isoDate));
}

export function formatShortDate(isoDate: string): string {
  return calendarFormat({ day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(isoDate));
}

export function formatDayOfMonth(isoDate: string): string {
  return calendarFormat({ day: 'numeric' }).format(new Date(isoDate));
}

export function formatMonthAbbreviation(isoDate: string): string {
  return calendarFormat({ month: 'short' }).format(new Date(isoDate));
}

export function formatMonthHeading(isoDate: string): string {
  const label = calendarFormat({ month: 'long', year: 'numeric' }).format(new Date(isoDate));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (startIso.slice(0, 10) === endIso.slice(0, 10)) return calendarFormat({ day: 'numeric', month: 'short', year: 'numeric' }).format(start);
  if (start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear()) {
    return `${start.getUTCDate()}–${calendarFormat({ day: 'numeric', month: 'short', year: 'numeric' }).format(end)}`;
  }
  return `${calendarFormat({ day: 'numeric', month: 'short' }).format(start)} – ${calendarFormat({ day: 'numeric', month: 'short', year: 'numeric' }).format(end)}`;
}

export function durationInDays(startIso: string, endIso: string): number {
  return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 86400000) + 1;
}

export function remainingSeatsLabel(remainingSeats: number, maxParticipants: number): string {
  if (remainingSeats <= 0) return 'Esaurito';
  if (remainingSeats === 1) return `Ultimo posto su ${maxParticipants}`;
  return `${remainingSeats} posti rimasti su ${maxParticipants}`;
}
