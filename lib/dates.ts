import { getAppTimeZone } from "@/lib/env";

type DateParts = {
  year: number;
  month: number;
  day: number;
};

function getDatePartsInTimeZone(value: Date, timeZone: string): DateParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const parts = formatter.formatToParts(value);
  const year = Number(parts.find((part) => part.type === "year")?.value ?? 0);
  const month = Number(parts.find((part) => part.type === "month")?.value ?? 0);
  const day = Number(parts.find((part) => part.type === "day")?.value ?? 0);

  return { year, month, day };
}

function toDateOnly(parts: DateParts) {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12));
}

export function normalizeDateOnly(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 12));
}

export function today() {
  return toDateOnly(getDatePartsInTimeZone(new Date(), getAppTimeZone()));
}

export function addDays(base: Date, days: number) {
  const date = normalizeDateOnly(base);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

export function startOfWeek(base: Date) {
  const day = normalizeDateOnly(base).getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(base, diff);
}

export function toDateString(value: Date) {
  const date = normalizeDateOnly(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDate(value: Date, locale: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: getAppTimeZone()
  }).format(normalizeDateOnly(value));
}
