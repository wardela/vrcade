const JORDAN_TIME_ZONE = "Asia/Amman";

const pad = (value, length = 2) => String(value).padStart(length, "0");

const SQL_TIMESTAMP_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?$/;

const formatPartsToSqlTimestamp = ({
  year,
  month,
  day,
  hour,
  minute,
  second,
  millisecond = 0,
}) =>
  `${pad(year, 4)}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}.${pad(
    millisecond,
    3,
  )}`;

const getJordanCurrentTimestamp = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: JORDAN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const values = Object.fromEntries(
    formatter
      .formatToParts(new Date())
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second}.000`;
};

const normalizeSqlTimestampString = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  const match = trimmedValue.match(SQL_TIMESTAMP_REGEX);
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second, fraction = "0"] = match;
  const millisecond = Number.parseInt(fraction.slice(0, 3).padEnd(3, "0"), 10);

  return formatPartsToSqlTimestamp({
    year,
    month,
    day,
    hour,
    minute,
    second,
    millisecond,
  });
};

const formatTimestampWithoutTimezone = (value) => {
  if (value == null) {
    return null;
  }

  const normalizedString = normalizeSqlTimestampString(value);
  if (normalizedString) {
    return normalizedString;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return formatPartsToSqlTimestamp({
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      day: value.getDate(),
      hour: value.getHours(),
      minute: value.getMinutes(),
      second: value.getSeconds(),
      millisecond: value.getMilliseconds(),
    });
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return formatPartsToSqlTimestamp({
    year: parsed.getFullYear(),
    month: parsed.getMonth() + 1,
    day: parsed.getDate(),
    hour: parsed.getHours(),
    minute: parsed.getMinutes(),
    second: parsed.getSeconds(),
    millisecond: parsed.getMilliseconds(),
  });
};

const parseFloatingTimestamp = (value) => {
  const normalizedValue = formatTimestampWithoutTimezone(value);
  if (!normalizedValue) {
    return null;
  }

  const match = normalizedValue.match(SQL_TIMESTAMP_REGEX);
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second, fraction = "0"] = match;
  const millisecond = Number.parseInt(fraction.slice(0, 3).padEnd(3, "0"), 10);

  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      millisecond,
    ),
  );
};

module.exports = {
  formatTimestampWithoutTimezone,
  getJordanCurrentTimestamp,
  parseFloatingTimestamp,
};
