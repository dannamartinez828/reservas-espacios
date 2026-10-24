const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;
const OPENING_MINUTES = 6 * 60;
const CLOSING_MINUTES = 22 * 60;

export function isValidCalendarDate(value) {
  const match = DATE_PATTERN.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) {
    return false;
  }

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ][month - 1];

  return day >= 1 && day <= daysInMonth;
}

export function timeToMinutes(value) {
  const match = TIME_PATTERN.exec(value);
  if (!match) {
    throw new RangeError('La hora debe tener el formato HH:MM.');
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    throw new RangeError('La hora está fuera del rango válido del día.');
  }

  return hours * 60 + minutes;
}

export function isValidReservationTime(start, end) {
  try {
    const startMinutes = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);
    return startMinutes >= OPENING_MINUTES
      && endMinutes <= CLOSING_MINUTES
      && startMinutes < endMinutes
      && startMinutes % 30 === 0
      && endMinutes % 30 === 0;
  } catch (error) {
    if (error instanceof RangeError) {
      return false;
    }
    throw error;
  }
}

export function isStartInFuture(date, startMinutes, now = new Date()) {
  if (!isValidCalendarDate(date) || !Number.isInteger(startMinutes)
    || startMinutes < 0 || startMinutes >= 24 * 60
    || !(now instanceof Date) || Number.isNaN(now.getTime())) {
    return false;
  }

  const today = [
    String(now.getFullYear()).padStart(4, '0'),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');

  if (date !== today) {
    return date > today;
  }

  const currentMinutes = now.getHours() * 60
    + now.getMinutes()
    + (now.getSeconds() * 1000 + now.getMilliseconds()) / 60000;
  return startMinutes > currentMinutes;
}
