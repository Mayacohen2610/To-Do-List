export const getStartOfWeek = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
};

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const isWithinRange = (date, rangeStart, rangeEnd) =>
  date.getTime() >= rangeStart.getTime() && date.getTime() < rangeEnd.getTime();

export const toDateTimeLocalValue = (value) => {
  const date = new Date(value);
  const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
};
